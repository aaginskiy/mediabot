const chai = require('chai');
const sinon = require('sinon');
const app = require('../../src/app');

const MediaFile = app.service('media-file');
const MediaFileService = require('../../src/services/media-file/media-file.class');

const childProcess = require('child_process');
const fs = require('fs');
const glob = require('glob-promise');
const _ = require('lodash');
const mockfs = require('mock-fs');

const { Readable } = require('stream');

chai.use(require('chai-things'));
chai.use(require('chai-like'));
chai.use(require('chai-string'));
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
// chai.use(require('dirty-chai'));

const { expect } = chai;
chai.should();

const fixture = {};

describe('\'Media File\' service', () => {
  before((done) => {
    this.movie = require('../fixtures/zathura.movie.json'); // eslint-disable-line global-require

    this.tripleZathura = require('../fixtures/triple-zathura.json'); // eslint-disable-line global-require

    this.fixture = {
      stdout: JSON.stringify(require('../fixtures/zathura.json')), // eslint-disable-line global-require
    };

    fixture.zathuraOne = {
      stdout: JSON.stringify(this.tripleZathura[0]),
    };

    fixture.zathuraTwo = {
      stdout: JSON.stringify(this.tripleZathura[1]),
    };

    fixture.zathuraThree = {
      stdout: JSON.stringify(this.tripleZathura[2]),
    };

    this.zathuraOneDir = [
      'zathura1.mkv',
      'zathura1-poster.jpg',
      'zathura1-fanart.jpg',
    ];

    this.execStub = sinon.stub(childProcess, 'exec').yields(new Error('ChildProcess.exec Stubbed Error.'));

    this.execStub.withArgs('mkvmerge -J good_filename.mkv').yields(null, this.fixture);

    this.execStub.withArgs('mkvmerge -J /fake/system/bad_file/bad_filename.mkv').yields(new Error('Bad File'));

    this.execStub.withArgs('mkvmerge -J bad_JSON.mkv').yields(null, { stdout: 'not JSON' });

    this.execStub.withArgs('mkvmerge -J /fake/system/zathura1/zathura1.mkv').yields(null, fixture.zathuraOne);

    this.execStub.withArgs('mkvmerge -J /fake/system/zathura2/zathura2.mkv').yields(null, fixture.zathuraTwo);

    this.execStub.withArgs('mkvmerge -J /fake/system/zathura3/zathura3.mkv').yields(null, fixture.zathuraThree);

    this.eventStub = new childProcess.ChildProcess();

    this.eventStub.stdout = new Readable();
    this.eventStub.stdout._read = sinon.spy();

    this.spawnStub = sinon.stub(childProcess, 'spawn').returns(this.eventStub);

    this.sandbox = sinon.sandbox.create();

    this.sandbox.stub(fs, 'readdir')
      .yields(null, this.zathuraOneDir);

    done();
  });

  after((done) => {
    // mock.restore();
    childProcess.exec.restore();
    childProcess.spawn.restore();
    this.sandbox.restore();
    done();
  });

  it('registered the service', () => expect(MediaFile, 'Registered the service').to.be.ok);

  it('should set options to {} if no options provided', () => {
    const service = new MediaFileService(null);
    expect(service.options).to.be.eql({});
  });

  describe('#loadFromFile', () => {
    it('should return empty object when filename is not supplied', () => 
      expect(MediaFile.loadFromFile(''))
        .to.eventually.be.eql({}));

    it('should return empty object when file is not found', () =>
      expect(MediaFile.loadFromFile('/fake/system/bad_filename.mkv'))
        .to.eventually.be.eql({}));

    context('when file exist', () => {
      it('should return non-empty object', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.be.an('object'));

      it('should return non-empty object', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.not.be.empty);

      it('should set \'dir\' property', () => 
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.have.property(
            'dir',
            '/fake/system/zathura1'));

      it('should set \'files\' property to an Array', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.have.property('files')
          .that.is.an('Array'));

      it('should set \'poster\' if it exists', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.have.property(
            'poster',
            'zathura1-poster.jpg'));

      it('should set \'fanart\' if it exists', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.have.property(
            'fanart',
            'zathura1-fanart.jpg'));

      it('should set \'videoTag\' to default video', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.have.property(
            'videoTag',
            'MPEG-4p10/AVC/h.264'));

      it('should set \'audioTag\' to default audio', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .to.eventually.have.property(
            'audioTag',
            'DTS 6ch'));
    });
  });

  describe('#parseMkvmergeInfo', () => {
    it('should catch any error from the external execution', () =>
      expect(MediaFile.parseMkvmergeInfo('bad_filename.mkv'))
        .to.be.rejectedWith('Stubbed Error.'));

    it('should call callback with correctly formatted object', () =>
      expect(MediaFile.parseMkvmergeInfo('good_filename.mkv'))
        .to.eventually.eql(this.movie));

    it('should return an error of JSON cannot be read', () =>
      expect(MediaFile.parseMkvmergeInfo('bad_JSON.mkv'))
        .to.eventually.be.rejected);
  });

  describe('#create', () => {
    before((done) => {
      sinon.stub(glob, 'promise').resolves([
        '/fake/system/zathura1/zathura1.mkv',
        '/fake/system/zathura2/zathura2.mkv',
      ]);
      done();
    });

    after((done) => {
      glob.promise.restore();
      done();
    });

    afterEach(() => MediaFile.Movie.remove(null));

    beforeEach(() =>
      MediaFile.Movie.create([
        {
          title: 'Ready to Delete',
          filename: '/fake/system/delete/delete.mkv',
        },
        {
          title: 'Existing Movie #1',
          filename: '/fake/system/zathura3/zathura3.mkv',
        },
      ]));

    it('should reload all files from directory if no filenames provided', () =>
      MediaFile.create({}, {
        query: {
          filenames: [],
        },
      })
        .should.eventually.have.property('created')
        .that.is.an('Array')
        .with.lengthOf(2)
        .that.includes.an.item.with.property('title', 'Zathura: A Space Adventure (2005)')
        .and.includes.an.item.with.property('title', 'Zathura: A Space Adventure 2 (2005)'));

    it('should create new movie if it does not exist', () =>
      MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/zathura1/zathura1.mkv'],
        },
      })
        .should.eventually.have.property('created')
        .that.is.an('Array')
        .with.lengthOf(1)
        .and.include.an.item.with.property('title', 'Zathura: A Space Adventure (2005)'));

    it('should not create new movie if it exists', () =>
      MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/zathura3/zathura3.mkv'],
        },
      })
        .should.eventually.have.property('created')
        .that.is.an('Array')
        .with.lengthOf(0));

    it('should update movie if it already exists', () =>
      MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/zathura3/zathura3.mkv'],
        },
      })
        .should.eventually.have.property('updated')
        .that.is.an('Array')
        .with.lengthOf(1)
        .and.include.an.item.with.property('title', 'Zathura: A Space Adventure 3 (2005)'));

    it('should not update movie if file doesn\'t exist', () =>
      MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/delete/delete.mkv'],
        },
      })
        .should.eventually.have.property('updated')
        .that.is.an('Array')
        .with.lengthOf(0));

    it('should delete movie if the file no longer exists when all movies are reloaded', () =>
      MediaFile.create({}, {
        query: {
          filenames: [],
        },
      })
        .should.eventually.have.property('deleted')
        .that.is.an('Array')
        .with.lengthOf(2));
  });

  describe('#get', () => {
    afterEach(() => MediaFile.Movie.remove(null));

    beforeEach(() =>
      Promise.all([
        MediaFile.Movie
          .create({
            title: 'Modified Existing Movie #1',
            filename: '/fake/system/zathura1/zathura1.mkv',
          })
          .then((res) => {
            this.goodFileId = res._id;
          }),
        MediaFile.Movie
          .create({
            title: 'Existing Movie #2',
            filename: '/fake/system/bad_file/bad_filename.mkv',
          })
          .then((res) => {
            this.badFileId = res._id;
          }),
      ]));

    it('should return media info for the movie specified by ID', () =>
      MediaFile.get(this.goodFileId).should.eventually.have.property(
        'title',
        'Zathura: A Space Adventure (2005)',
      ));

    it('should return an error if movie does not exist', () =>
      MediaFile.get(this.badFileId).should.be.rejectedWith('Bad File'));
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
            isForced: true,
          },
        ],
      };

      this.dataCommand = MediaFile.generateInfoCommand(this.data);

      this.execStub
        .withArgs(`mkvpropedit -v bad_filename.mkv ${this.dataCommand}`)
        .yields(new Error('mkvpropedit error'));

      this.execStub
        .withArgs(`mkvpropedit -v good_filename.mkv ${this.dataCommand}`)
        .yields(null, { stdout: 'test' });

      done();
    });

    afterEach(() => MediaFile.Movie.remove(null));

    beforeEach(() =>
      Promise.all([
        MediaFile.Movie
          .create({
            title: 'Modified Existing Movie #1',
            filename: 'good_filename.mkv',
          })
          .then((res) => {
            this.goodFileId = res._id;
          }),
        MediaFile.Movie
          .create({
            title: 'Existing Movie #2',
            filename: 'bad_filename.mkv',
          })
          .then((res) => {
            this.badFileId = res._id;
          }),
      ]));

    it('should call mkvpropedit with the right command', () =>
      MediaFile.patch(this.goodFileId, this.data).then(() =>
        expect(this.execStub).calledWithMatch('mkvpropedit')));
  });

  describe.skip('#update', () => {
    it('should update the file media info with new metadata');

    it('should add mux job to queue when mux is required');

    it('should not add mux job to queue when mux is not required');
  });

  describe('#generateInfoCommand', () => {
    let data;

    before((done) => {
      data = {
        title: 'Test Movie',
        filename: 'test_movie.mkv',
        tracks: [
          {
            number: 0,
          },
          {
            number: 1,
          },
        ],
      };

      done();
    });

    it('should set the media title', (done) => {
      expect(MediaFile.generateInfoCommand(data)).to.contain('--edit info --set "title=Test Movie"');
      done();
    });

    it('should delete track parameters when they are empty', (done) => {
      expect(MediaFile.generateInfoCommand(data)).to.contain('--edit track:1 --delete name --delete language --set "flag-default=0" --set "flag-enabled=0" --set "flag-forced=0"');
      done();
    });

    it('should not have track in command if no tracks present', (done) => {
      MediaFile.generateInfoCommand({
        title: 'Test Movie',
        filename: 'test_movie.mkv',
      }).should.not.contain('--edit track');
      done();
    });

    it('should set each track parameter when not empty', (done) => {
      const instanceData = data;

      instanceData.tracks[0].name = 'Track Name';
      instanceData.tracks[0].language = 'en';
      instanceData.tracks[0].isDefault = true;
      instanceData.tracks[0].isEnabled = true;
      instanceData.tracks[0].isForced = true;
      expect(MediaFile.generateInfoCommand(instanceData)).to.contain('--edit track:1 --set "name=Track Name" --set "language=en" --set "flag-default=1" --set "flag-enabled=1" --set "flag-forced=1"');
      done();
    });
  });

  describe('#generateMergeCommand', () => {
    let mergeFixture;

    beforeEach(() => {
      mergeFixture = _.merge({}, this.movie);
    });

    it('should be an array', (done) => {
      expect(MediaFile.generateMergeCommand(mergeFixture)).to.an('Array');
      done();
    });

    it('should contain \' -D\' if no video tracks to mux', (done) => {
      mergeFixture.tracks[0].isMuxed = false;
      expect(MediaFile.generateMergeCommand(mergeFixture)).to.include.something.that.eql('-D');
      done();
    });

    it('should contain \' -A\' if no audio tracks to mux', (done) => {
      mergeFixture.tracks[1].isMuxed = false;
      expect(MediaFile.generateMergeCommand(mergeFixture)).to.include.something.that.eql('-A');
      done();
    });

    it('should contain \' -S\' if no subtitle tracks to mux', (done) => {
      mergeFixture.tracks[2].isMuxed = false;
      expect(MediaFile.generateMergeCommand(mergeFixture)).to.include.something.that.eql('-S');
      done();
    });

    it('should contain \' -d track.number\' if one video track to mux', (done) => {
      expect(MediaFile.generateMergeCommand(mergeFixture))
        .to.include.something.that.eql('-d')
        .and.to.include.something.that.eql(`${mergeFixture.tracks[0].number}`);
      done();
    });

    it('should contain \' -a track.number\' if one audio track to mux', (done) => {
      expect(MediaFile.generateMergeCommand(mergeFixture))
        .to.include.something.that.eql('-a')
        .and.to.include.something.that.eql(`${mergeFixture.tracks[1].number}`);
      done();
    });

    it('should contain \' -s track.number\' if one subtitles track to mux', (done) => {
      expect(MediaFile.generateMergeCommand(mergeFixture))
        .to.include.something.that.eql('-s')
        .and.to.include.something.that.eql(`${mergeFixture.tracks[2].number}`);
      done();
    });

    it('should contain \' -M\' to remove attachments', (done) => {
      expect(MediaFile.generateMergeCommand(mergeFixture)).to.include.something.that.eql('-M');
      done();
    });

    it('should reorder tracks by newNumber', (done) => {
      mergeFixture.tracks[1].newNumber = 3;
      mergeFixture.tracks[2].newNumber = 2;

      expect(MediaFile.generateMergeCommand(mergeFixture))
        .to.include.something.that.eql('--track-order')
        .and.to.include.something.that.eql('0:0,0:2,0:1');
      done();
    });

    it('should output to temporary file', (done) => {
      mergeFixture.filename = '/test/directory/filename.mkv';

      expect(MediaFile.generateMergeCommand(mergeFixture)).to.contain.an.item('"/test/directory/filename.rmdddbtmp"');
      done();
    });

    it('should set title', (done) => {
      mergeFixture.title = 'Test Title';
      expect(MediaFile.generateMergeCommand(mergeFixture))
        .to.include.something.that.eql('--title')
        .and.to.include.something.that.eql('"Test Title"');
      done();
    });
  });

  describe('#mux', () => {
    let mergeFixture;

    before((done) => {
      mergeFixture = _.merge({}, this.movie);
      done();
    });

    afterEach((done) => {
      this.spawnStub.resetHistory();
      done();
    });

    // it('should call mkvmerge through process.spawn', (done) => {
    //   MediaFile.mux(1, mergeFixture);
    //   expect(this.spawnStub).to.be.calledWithMatch('mkvmerge');
    //   done();
    // });

    context('when \'data\' message is emitted', () => {
      it.skip('should aggregate error messages', () => {
        const event = MediaFile.mux(1, mergeFixture);
        this.eventStub.stdout.emit('data', Buffer.from('Error: Error #1'));
        this.eventStub.stdout.emit('data', Buffer.from('Error: Error #2'));
        this.eventStub.emit('exit', 2);
        return expect(event).to.eventually.be.rejectedWith(
          Error,
          'Received \'exit\' message with code \'2\'',
        );
      });

      it.skip('should call progress function on progress', (done) => {
        const progressSpy = sinon.spy();
        MediaFile.mux(1, mergeFixture, progressSpy);

        this.eventStub.stdout.emit('data', Buffer.from('Progress: 10%'));
        this.eventStub.stdout.emit('data', Buffer.from('Progress: 100%'));
        this.eventStub.emit('exit', 0);

        expect(progressSpy).to.be.calledTwice; // eslint-disable-line no-unused-expressions
        done();
      });
    });

    it.skip('should reject when \'error\' message is emitted', () => {
      const event = MediaFile.mux(1, mergeFixture);
      this.eventStub.emit('error', 'Error');
      return expect(event).to.eventually.be.rejectedWith(
        Error,
        'Received \'error\' message with \'Error\'',
      );
    });

    it.skip('should resolve when \'exit\' message is received with code 0', () => {
      const event = MediaFile.mux(1, mergeFixture);
      this.eventStub.emit('exit', 0);
      return expect(event).to.eventually.be.fulfilled;
    });

    it.skip('should resolve when \'exit\' message is received with code 1', () => {
      const event = MediaFile.mux(1, mergeFixture);
      this.eventStub.emit('exit', 1);
      return expect(event).to.eventually.be.fulfilled;
    });

    it.skip('should resolve when \'exit\' message is received with code 2', () => {
      const event = MediaFile.mux(1, mergeFixture);
      this.eventStub.emit('exit', 2);
      return expect(event).to.eventually.be.rejectedWith(
        Error,
        'Received \'exit\' message with code \'2\'',
      );
    });
  });
});
