const assert = require('assert');
const app = require('../../src/app');
const MediaFile = app.service('media-file');

var sinon = require('sinon');
var child_process = require('child_process');
var glob = require('glob-promise');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('sinon-chai'));

chai.use(require('chai-as-promised'));

describe('\'Media File\' service', () => {
  it('registered the service', () => {
    const service = app.service('media-file');

    expect(service, 'Registered the service').to.be.ok;
  });
});

describe('#find', () => {
  var mediaArrayFixture;
  var _readMovieInfoStub;

  before(function (done) {
    sinon.stub(glob, 'promise').resolves(['filename1.mkv', 'filename2.mkv', 'filenam3.mkv']);

    mediaArrayFixture = require('../fixtures/triple-zathura.json');
    done();
  });

  after(function (done){
    glob.promise.restore();
    done();
  });

  beforeEach((done) => {
    _readMovieInfoStub = sinon.stub(MediaFile, '_readMovieInfo')
      .onFirstCall().resolves(mediaArrayFixture[0])
      .onSecondCall().resolves(mediaArrayFixture[1])
      .onThirdCall().resolves(mediaArrayFixture[2])
      .resolves(mediaArrayFixture[0]);

    _readMovieInfoStub.withArgs('bad_filename.mkv').rejects('Error');
    done();
  });

  afterEach((done) => {
    MediaFile._readMovieInfo.restore();
    done();
  });

  it('should return no media file info when no filenames is supplied', () => {
    var params = {
      query: {}
    };

    var mediaArray = MediaFile.find(params);
    
    return expect(mediaArray).to.eventually.be.eql([]);
  });

  it('should return media info for each file when arg is array', () => {
    var params = {
      query: {
        filenames: ['filename.mkv']
      }
    };

    var mediaArray = MediaFile.find(params);

    return expect(mediaArray).to.eventually.be.eql([mediaArrayFixture[0]]);
  });

  it('should not return movie if filename is not found', () => {
    var params = {
      query: {
        filenames: ['filename.mkv', 'bad_filename.mkv', 'filename2.mkv']
      }
    };

    var mediaArray = MediaFile.find(params);

    return expect(mediaArray).to.eventually.be.eql([mediaArrayFixture[0], mediaArrayFixture[2]]);
  });

  it('should return [] if no files are found', () => {
    var params = {
      query: {
        filenames: []
      }
    };

    var mediaArray = MediaFile.find(params);

    return expect(mediaArray).to.eventually.be.eql([]);
  });
});

describe('#create', () => {
  var newMovieFixture, existingMovieFixture, dbMovieFixture;

  before(function (done) {
    // Set up fixtures
    newMovieFixture = [{
      title: 'New Movie #1',
      filename: 'new_movie_1.mkv'
    },
    {
      title: 'New Movie #2',
      filename: 'new_movie_2.mkv'
    }];

    existingMovieFixture = [{
      title: 'Modified Existing Movie #1',
      filename: 'existing_movie_1.mkv'
    },
    {
      title: 'Existing Movie #2',
      filename: 'existing_movie_2.mkv'
    }];

    dbMovieFixture = [{
      title: 'Modified Existing Movie #1',
      filename: 'existing_movie_1.mkv'
    },
    {
      title: 'Existing Movie #2',
      filename: 'existing_movie_2.mkv'
    }];

    var movieInfoStub = sinon.stub(MediaFile, '_readMovieInfo')
      .withArgs('new_movie_1.mkv')
      .resolves(newMovieFixture[0]);

    movieInfoStub.withArgs('new_movie_2.mkv')
      .resolves(newMovieFixture[1]);

    movieInfoStub.withArgs('existing_movie_1.mkv')
      .resolves(existingMovieFixture[0]);

    movieInfoStub.withArgs('existing_movie_2.mkv')
      .resolves(existingMovieFixture[1]);

    sinon.stub(glob, 'promise').resolves(['new_movie_1.mkv', 'new_movie_2.mkv']);
      
    done();
  });

  after((done) => {
    MediaFile._readMovieInfo.restore();
    glob.promise.restore();

    done();
  });

  afterEach((done) => {
    // Clear database again to be on the same side.
    MediaFile.Movie.remove(null).then(() => {
      done();
    });
  });

  beforeEach((done) => {
    // Set up existing movies
    MediaFile.Movie.create(dbMovieFixture).then(() => {
      done();
    });
  });

  it('should reload all files from directory if no filenames provided', () => {
    var params = {
      query: {
        filenames: []
      }
    };

    return MediaFile.create(null, params).then(res => {
      expect(res.created.length).to.eql(2);
      expect(res.created[0].title).to.eql('New Movie #1');
      expect(res.created[0].filename).to.eql('new_movie_1.mkv');
    });
  });

  it('should create new movie if it does not exist', () => {
    var params = {
      query: {
        filenames: ['new_movie_1.mkv']
      }
    };

    return MediaFile.create(null, params).then(res => {
      expect(res.created[0].title).to.eql('New Movie #1');
      expect(res.created[0].filename).to.eql('new_movie_1.mkv');
    });
  });

  it('should not create new movie if it exists', () => {
    var params = {
      query: {
        filenames: ['existing_movie_2.mkv']
      }
    };

    return MediaFile.create(null, params).then(res => {
      expect(res.created).to.eql([]);
    });
  });

  it('should patch movie if it exists', () => {
    var params = {
      query: {
        filenames: ['existing_movie_1.mkv']
      }
    };

    return MediaFile.create(null, params).then(res => {
      expect(res.patched[0].title).to.eql('Modified Existing Movie #1');
    });
  });

  it.skip('should delete movie if the file no longer exists when all movies are reloaded', () => {
    
  });
});

describe('#get', () => {
  var newMovieFixture, dbMovieFixture;

  before(function (done) {
    // Set up fixtures
    dbMovieFixture = [{
      title: 'Modified Existing Movie #1',
      filename: 'existing_movie_1.mkv'
    },
    {
      title: 'Existing Movie #2',
      filename: 'existing_movie_2.mkv'
    }];

    newMovieFixture = require('../fixtures/zathura.json');

    var execStub = sinon.stub(child_process, 'exec')
      .withArgs('mkvmerge -i existing_movie_1.mkv -F json')
      .yields(null, newMovieFixture, null);

    execStub.withArgs('mkvmerge -i existing_movie_2.mkv -F json')
      .yields(new Error('Stubbed Error.'), newMovieFixture, null);

    done();
  });

  after((done) => {
    child_process.exec.restore();

    done();
  });

  afterEach(() => MediaFile.Movie.remove(null));

  beforeEach(() => Promise.all([
    MediaFile.Movie.create(dbMovieFixture[0]).then(res => this.goodFileId = res._id),
    MediaFile.Movie.create(dbMovieFixture[1]).then(res => this.badFileId = res._id)
  ]));

  it('should return media info for the movie specified by ID', () => 
    expect(MediaFile.get(this.goodFileId)).to.eventually.have.property('title', 'Zathura: A Space Adventure (2005)'));

  it('should return an error if movie does not exist', () => 
    expect(MediaFile.get(this.badFileId)).to.be.rejectedWith('Stubbed Error'));
});

describe('#patch', () => {
  before((done) => {
    this.data = {
      title: 'Movie Title',
      filename: 'test_movie.mkv',
      tracks: [
        {
          name: 'Track Name',
          language: 'en',
          isDefault: true,
          isEnabled: true,
          isForced: true
        }
      ]
    };

    this.dataCommand = MediaFile._generateInfoCommand(this.data);

    this.execStub = sinon.stub(child_process, 'exec')
      .yields(null, {}, null);

    this.dbMovieFixture = [{
      title: 'Modified Existing Movie #1',
      filename: 'existing_movie_1.mkv'
    },
    {
      title: 'Existing Movie #2',
      filename: 'existing_movie_2.mkv'
    }];
      
    done();
  });

  after((done) => {
    child_process.exec.restore();
    done();
  });

  afterEach(() => MediaFile.Movie.remove(null));

  beforeEach(() => Promise.all([
    MediaFile.Movie.create(this.dbMovieFixture[0]).then(res => this.goodFileId = res._id),
    MediaFile.Movie.create(this.dbMovieFixture[1]).then(res => this.badFileId = res._id)
  ]));

  it('should call mkvpropedit with the right command', (done) => {
    MediaFile.patch(this.goodFileId, this.data).then(() => {
      expect(this.execStub).calledWithMatch('mkvpropedit');
      done();
    });
  });
});

describe.skip('#update', () => {
  it('should update the file media info with new metadata', () => {

  });

  it('should add mux job to queue when mux is required', () => {

  });

  it('should not add mux job to queue when mux is not required', () => {

  });
});

describe('#_readMovieInfo()', function () {

  before(function (done) {
    //Stub out mkvmerge process call

    this.movie = {
      title: 'Zathura: A Space Adventure (2005)',
      filename: 'Zathura A Space Adventure (2005).1080p.mkv',
      tracks: [
        {
          trackName: 'Zathura: A Space Adventure (2005)',
          language: 'eng',
          number: 1,
          type: 'video',
          codecType: 'MPEG-4p10/AVC/h.264',
          isDefault: true,
          isEnabled: true,
          isForced: false
        },
        {
          trackName: undefined,
          language: 'eng',
          number: 2,
          type: 'audio',
          codecType: 'DTS',
          audioChannels: 6,
          bps: undefined,
          isDefault: true,
          isEnabled: true,
          isForced: false
        },
        {
          trackName: undefined,
          language: 'dut',
          number: 3,
          type: 'subtitles',
          codecType: 'SubRip/SRT',
          isDefault: false,
          isEnabled: false,
          isForced: false
        }
      ]
    };

    this.fixture = {
      'attachments': [],
      'chapters': [
        {
          'num_entries': 16
        }
      ],
      'container': {
        'properties': {
          'container_type': 17,
          'duration': 6080074000000,
          'is_providing_timecodes': true,
          'segment_uid': '852d09864c829f0bb2fcfe4f7cec65b7',
          'title': 'Zathura: A Space Adventure (2005)'
        },
        'recognized': true,
        'supported': true,
        'type': 'Matroska'
      },
      'errors': [],
      'file_name': 'Zathura A Space Adventure (2005).1080p.mkv',
      'global_tags': [],
      'identification_format_version': 2,
      'track_tags': [],
      'tracks': [
        {
          'codec': 'MPEG-4p10/AVC/h.264',
          'id': 0,
          'properties': {
            'codec_id': 'V_MPEG4/ISO/AVC',
            'codec_private_data': '01640029ffe1001867640029acc8501e0083fa8400000fa40002ee023c60c65801000668e9386cb22c',
            'codec_private_length': 41,
            'default_duration': 41708333,
            'default_track': true,
            'display_dimensions': '1920x1038',
            'enabled_track': true,
            'forced_track': false,
            'language': 'eng',
            'number': 1,
            'packetizer': 'mpeg4_p10_video',
            'pixel_dimensions': '1920x1038',
            'track_name': 'Zathura: A Space Adventure (2005)',
            'uid': 651697575
          },
          'type': 'video'
        },
        {
          'codec': 'DTS',
          'id': 1,
          'properties': {
            'audio_channels': 6,
            'audio_sampling_frequency': 48000,
            'codec_id': 'A_DTS',
            'codec_private_length': 0,
            'default_track': true,
            'enabled_track': true,
            'forced_track': false,
            'language': 'eng',
            'number': 2,
            'uid': 1785271955
          },
          'type': 'audio'
        },
        {
          'codec': 'SubRip/SRT',
          'id': 2,
          'properties': {
            'codec_id': 'S_TEXT/UTF8',
            'codec_private_length': 0,
            'default_track': false,
            'enabled_track': false,
            'forced_track': false,
            'language': 'dut',
            'number': 3,
            'text_subtitles': true,
            'uid': 1293880464
          },
          'type': 'subtitles'
        }
      ],
      'warnings': []
    };
    done();
  });

  afterEach(function (done) {
    child_process.exec.restore();
    done();
  });

  it('should catch any error from the external execution', function () {
    sinon.stub(child_process, 'exec').yields(new Error('Stubbed Error.'), this.fixture, null);
    const service = app.service('media-file');

    return expect(service._readMovieInfo('Zathura A Space Adventure (2005).1080p.mkv')).to.be.rejectedWith('Stubbed Error.');
  });

  it('should call callback with correctly formatted object', function () {
    sinon.stub(child_process, 'exec').yields(null, this.fixture, null);

    var movieFixture = this.movie;
    const service = app.service('media-file');

    return expect(service._readMovieInfo('Zathura A Space Adventure (2005).1080p.mkv')).to.eventually.eql(movieFixture);
  });
});

describe('#_generateInfoCommand', () => {
  var data;

  before((done) => {
    data = {
      title: 'Test Movie',
      filename: 'test_movie.mkv',
      tracks: [
        {
          number: 1
        },
        {
          number: 2
        }
      ]
    };
    
    done();
  });

  it('should set the media title', (done) => {
    expect(MediaFile._generateInfoCommand(data)).to.contain('--edit\\ info\\ --set\\ \\"title\\=Test\\ Movie\\"');
    done();
  });

  it('should delete track parameters when they are empty', (done) => {
    expect(MediaFile._generateInfoCommand(data))
      .to.contain('--edit\\ track:1\\ --delete\\ name\\ --delete\\ language\\ --delete\\ flag-default\\ --delete\\ flag-enabled\\ --delete\\ flag-forced');
    done();
  });

  it('should set each track parameter when not empty', (done) => {
    var instanceData = data;

    instanceData.tracks[0].name = "Track Name";
    instanceData.tracks[0].language = "en";
    instanceData.tracks[0].isDefault = true;
    instanceData.tracks[0].isEnabled = true;
    instanceData.tracks[0].isForced = true;
    expect(MediaFile._generateInfoCommand(instanceData))
      .to.contain('--edit\\ track:1\\ --set\\ \\"name\\=Track\\ Name\\"\\ --set\\ \\"language\\=en\\"\\ --set\\ \\"flag-default\\=1\\"\\ --set\\ \\"flag-enabled\\=1\\"\\ --set\\ \\"flag-forced\\=1\\"');
    done();
  });

});
