const app = require('../../src/app');
const MediaFile = app.service('media-file');
const _ = require('lodash');

var sinon = require('sinon');
var child_process = require('child_process');
var glob = require('glob-promise');
var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

chai.use(require('chai-things'));
chai.use(require('chai-like'));

chai.use(require('chai-string'));

var fixture = {};

chai.use(require('sinon-chai'));

chai.use(require('chai-as-promised'));

describe('\'Media File\' service', () => {

  before(done => {
    //Stub out mkvmerge process call

    this.movie = require('../fixtures/zathura.movie.json');

    this.tripleZathura = require('../fixtures/triple-zathura.json');

    this.fixture = {
      stdout: JSON.stringify(require('../fixtures/zathura.json'))
    };

    fixture.zathuraOne = {
      stdout: JSON.stringify(this.tripleZathura[0])
    };

    fixture.zathuraTwo = {
      stdout: JSON.stringify(this.tripleZathura[1])
    };

    fixture.zathuraThree = {
      stdout: JSON.stringify(this.tripleZathura[2])
    };

    this.execStub = sinon.stub(child_process, 'exec').yields(new Error('Stubbed Error.'));
    
    this.execStub.withArgs('mkvmerge -J good_filename.mkv')
      .yields(null, this.fixture);

    this.execStub.withArgs('mkvmerge -J bad_filename.mkv')
      .yields(new Error('Stubbed Error.'));

    this.execStub.withArgs('mkvmerge -J zathura1.mkv')
      .yields(null, fixture.zathuraOne);

    this.execStub.withArgs('mkvmerge -J zathura2.mkv')
      .yields(null, fixture.zathuraTwo);

    this.execStub.withArgs('mkvmerge -J zathura3.mkv')
      .yields(null, fixture.zathuraThree);

    done();
  });

  after(done => {
    child_process.exec.restore();
    done();
  });

  it('registered the service', () => {

    expect(MediaFile, 'Registered the service').to.be.ok;
  });

  describe('#find', () => {
    before(function (done) {
      sinon.stub(glob, 'promise').resolves(['zathura1.mkv', 'zathura2.mkv', 'zathura3.mkv']);

      done();
    });

    after(function (done) {
      glob.promise.restore();
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
          filenames: ['zathura1.mkv', 'zathura2.mkv', 'zathura3.mkv']
        }
      };

      var mediaInfo = MediaFile.find(params);

      return Promise.all([
        expect(mediaInfo).to.eventually.have.lengthOf(3),
        expect(mediaInfo).to.eventually.have.nested.property('[0].title', 'Zathura: A Space Adventure (2005)'),
        expect(mediaInfo).to.eventually.have.nested.property('[1].title', 'Zathura: A Space Adventure 2 (2005)'),
        expect(mediaInfo).to.eventually.have.nested.property('[2].title', 'Zathura: A Space Adventure 3 (2005)')
      ]);
    });

    it('should not return movie if filename is not found', () => {
      var params = {
        query: {
          filenames: ['zathura1.mkv', 'bad_filename.mkv', 'zathura3.mkv']
        }
      };

      var mediaInfo = MediaFile.find(params);

      return Promise.all([
        expect(mediaInfo).to.eventually.have.lengthOf(2),
        expect(mediaInfo).to.eventually.have.nested.property('[0].title', 'Zathura: A Space Adventure (2005)'),
        expect(mediaInfo).to.eventually.have.nested.property('[1].title', 'Zathura: A Space Adventure 3 (2005)')
      ]);
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
    before(function (done) {
      sinon.stub(glob, 'promise').resolves(['zathura1.mkv', 'zathura2.mkv']);
      done();
    });

    after((done) => {
      glob.promise.restore();
      done();
    });

    afterEach(() => MediaFile.Movie.remove(null));

    beforeEach(() => MediaFile.Movie.create([{
      title: 'Modified Existing Movie #1',
      filename: 'existing_movie_1.mkv'
    },
    {
      title: 'Existing Movie #2',
      filename: 'zathura3.mkv'
    }]));

    it('should reload all files from directory if no filenames provided', () => {
      return MediaFile.create(null, {
        query: {
          filenames: []
        }
      }).should.eventually.have.property('created').that.is.an('Array').with.lengthOf(2)
        .that.includes.an.item.with.property('title', 'Zathura: A Space Adventure (2005)')
        .and.includes.an.item.with.property('title', 'Zathura: A Space Adventure 2 (2005)');
    });

    it('should create new movie if it does not exist', () => {
      return MediaFile.create(null, {
        query: {
          filenames: ['zathura1.mkv']
        }
      }).should.eventually.have.property('created').that.is.an('Array').with.lengthOf(1)
        .and.include.an.item.with.property('title', 'Zathura: A Space Adventure (2005)');
    });

    it('should not create new movie if it exists', () => {
      return MediaFile.create(null, {
        query: {
          filenames: ['zathura3.mkv']
        }
      }).should.eventually.have.property('created').that.is.an('Array').with.lengthOf(0);
    });

    it('should patch movie if it already exists', () => {
      return MediaFile.create(null, {
        query: {
          filenames: ['zathura3.mkv']
        }
      }).should.eventually.have.property('updated').that.is.an('Array').with.lengthOf(1)
        .and.include.an.item.with.property('title', 'Zathura: A Space Adventure 3 (2005)');
    });

    it('should not patch movie if file doesn\'t exist', () => {
      return MediaFile.create(null, {
        query: {
          filenames: ['bad_filename.mkv']
        }
      }).should.eventually.have.property('updated').that.is.an('Array').with.lengthOf(0);
    });

    it('should delete movie if the file no longer exists when all movies are reloaded');
  });

  describe('#get', () => {
    afterEach(() => MediaFile.Movie.remove(null));

    beforeEach(() => Promise.all([
      MediaFile.Movie.create({
        title: 'Modified Existing Movie #1',
        filename: 'good_filename.mkv'
      }).then(res => this.goodFileId = res._id),
      MediaFile.Movie.create({
        title: 'Existing Movie #2',
        filename: 'bad_filename.mkv'
      }).then(res => this.badFileId = res._id)
    ]));

    it('should return media info for the movie specified by ID', () =>
      MediaFile.get(this.goodFileId)
        .should.eventually.have.property('title', 'Zathura: A Space Adventure (2005)'));

    it('should return an error if movie does not exist', () =>
      MediaFile.get(this.badFileId).should.be.rejectedWith('Stubbed Error'));
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

      this.execStub.withArgs(`mkvpropedit -v bad_filename.mkv ${this.dataCommand}`)
        .yields(new Error('mkvpropedit error'));

      this.execStub.withArgs(`mkvpropedit -v good_filename.mkv ${this.dataCommand}`)
        .yields(null, {stdout: 'test'});

      done();
    });

    afterEach(() => MediaFile.Movie.remove(null));

    beforeEach(() => Promise.all([
      MediaFile.Movie.create({
        title: 'Modified Existing Movie #1',
        filename: 'good_filename.mkv'
      }).then(res => this.goodFileId = res._id),
      MediaFile.Movie.create({
        title: 'Existing Movie #2',
        filename: 'bad_filename.mkv'
      }).then(res => this.badFileId = res._id)
    ]));

    it('should call mkvpropedit with the right command', () => {
      return MediaFile.patch(this.goodFileId, this.data).then(() => {
        expect(this.execStub).calledWithMatch('mkvpropedit');
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

  describe('#_readMovieInfo', () => {

    it('should catch any error from the external execution', () => expect(MediaFile._readMovieInfo('bad_filename.mkv'))
      .to.be.rejectedWith('Stubbed Error.'));

    it('should call callback with correctly formatted object', () => expect(MediaFile._readMovieInfo('good_filename.mkv'))
      .to.eventually.eql(this.movie));
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

    it('should not have track in command if no tracks present', (done) => {
      MediaFile._generateInfoCommand({
        title: 'Test Movie',
        filename: 'test_movie.mkv'
      }).should.not.contain('--edit track');
      done();
    });

    it('should set each track parameter when not empty', (done) => {
      var instanceData = data;

      instanceData.tracks[0].name = 'Track Name';
      instanceData.tracks[0].language = 'en';
      instanceData.tracks[0].isDefault = true;
      instanceData.tracks[0].isEnabled = true;
      instanceData.tracks[0].isForced = true;
      expect(MediaFile._generateInfoCommand(instanceData))
        .to.contain('--edit\\ track:1\\ --set\\ \\"name\\=Track\\ Name\\"\\ --set\\ \\"language\\=en\\"\\ --set\\ \\"flag-default\\=1\\"\\ --set\\ \\"flag-enabled\\=1\\"\\ --set\\ \\"flag-forced\\=1\\"');
      done();
    });

  });

  describe('#_generateMergeCommand', () => {
    var mergeFixture;

    beforeEach(() => {
      mergeFixture = _.merge({}, this.movie);
    });

    it('should contain \' -D\' if no video tracks to mux', (done) => {
      mergeFixture.tracks[0].isMuxed = false;
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(' -D');
      done();
    });

    it('should contain \' -A\' if no audio tracks to mux', (done) => {
      mergeFixture.tracks[1].isMuxed = false;
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(' -A');
      done();
    });

    it('should contain \' -S\' if no subtitle tracks to mux', (done) => {
      mergeFixture.tracks[2].isMuxed = false;
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(' -S');
      done();
    });

    it('should contain \' -d track.number\' if one video track to mux', (done) => {
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(` -d ${mergeFixture.tracks[0].number - 1}`);
      done();
    });

    it('should contain \' -a track.number\' if one audio track to mux', (done) => {
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(` -a ${mergeFixture.tracks[1].number - 1}`);
      done();
    });

    it('should contain \' -s track.number\' if one subtitles track to mux', (done) => {
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(` -s ${mergeFixture.tracks[2].number - 1}`);
      done();
    });

    it('should contain \' -M\' to remove attachments', (done) => {
      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(' -M');
      done();
    });

    it('should reorder tracks by newNumber', (done) => {
      mergeFixture.tracks[1].newNumber = 3;
      mergeFixture.tracks[2].newNumber = 2;

      expect(MediaFile._generateMergeCommand(mergeFixture)).to.contain(' --track-order 0:0,0:2,0:1');
      done();
    });

    it('should output to temporary file', (done) => {
      mergeFixture.filename = '/test/directory/filename.mkv';

      expect(MediaFile._generateMergeCommand(mergeFixture))
        .to.startWith('mkvmerge --output "/test/directory/filename.rmbtmp"');
      done();
    });

    it('should set title', (done) => {
      mergeFixture.title = 'Test Title';

      expect(MediaFile._generateMergeCommand(mergeFixture))
        .to.contain('--title "Test Title"');
      done();
    });

  });
});
