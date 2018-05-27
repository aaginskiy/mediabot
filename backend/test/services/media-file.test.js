const assert = require('assert');
const app = require('../../src/app');
const MediaFile = app.service('media-file');

var sinon = require('sinon');
var child_process = require('child_process');

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

describe('\'Media File\' service', () => {
  it('registered the service', () => {
    const service = app.service('media-file');

    assert.ok(service, 'Registered the service');
  });
});

describe.skip('#find', () => {
  it('should return all media files in directory when arg is null', () => {
    // sinon.stub(MediaFile, '_readMovieInfo');
    // sinon.stub(glob, 'glob')

    var mediaArrayFixture = require('../fixtures/triple-zathura.json');
    var mediaArray = MediaFile.find(null);

    // MediaFile._readMovieInfo.restore();
    // glob.glob.restore();
    return expect(mediaArray).to.eventually.be.eql(mediaArrayFixture);
  });

  it('should return media info for specific file when arg is string', () => {
    // sinon.stub(MediaFile, '_readMovieInfo');
    // sinon.stub(glob, 'glob')

    var mediaArrayFixture = require('../fixtures/triple-zathura.json');
    var mediaArray = MediaFile.find('some/random/filename');

    // MediaFile._readMovieInfo.restore();
    // glob.glob.restore();
    return expect(mediaArray).to.eventually.be.eql(mediaArrayFixture);
  });

  it('should return media info for each file when arg is array', () => {
    
  });

  it('should return null if no files are found', () => {
    // sinon.stub(MediaFile, '_readMovieInfo');
    // sinon.stub(glob, 'glob')

    var mediaArray = MediaFile.find('some/random/wrong/filename');

    // MediaFile._readMovieInfo.restore();
    // glob.glob.restore();
    return expect(mediaArray).to.eventually.be.null;
  });
});

describe.skip('#get', () => {
  it('should return media info for the movie specified by ID', () => {
    
  });

  it('should return an error if movie does not exist', () => {
    
  });
});

describe.skip('#patch', () => {
  it('should update the file media info with new metadata', () => {
    
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

