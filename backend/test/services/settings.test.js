const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');

chai.use(require('chai-things'));
chai.use(require('chai-like'));
chai.use(require('chai-string'));
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const { expect } = chai;
chai.should();

const fs = require('fs');

const app = require('../../src/app');
const SettingsService = app.service('settings');

describe('\'Settings\' service', () => {
  it('registered the service', () => 
    expect(SettingsService, 'Registered the service')
      .to.be.ok);

  before(done => {
    const settingsJSON = JSON.stringify({
      movieDirectory: '/dev/test'
    });

    this.readFileStub = sinon.stub(fs, 'readFile').withArgs('/good/config.json').yields(null, settingsJSON);

    this.readFileStub.withArgs('/bad/config.json').yields(new Error('File stub error.'));

    this.writeFileStub = sinon.stub(fs, 'writeFile').yields(null, '');

    this.writeFileStub.withArgs('/bad/config.json').yields(new Error('File stub error.'));

    sinon.spy(SettingsService, 'update');

    done();
  });

  after(done => {
    fs.readFile.restore();
    fs.writeFile.restore();
    SettingsService.update.restore();
    done();
  });

  describe('#create', () => {
    it('should resolve with settings object if successful', () => {
      app.set('configLocation', '/good')
      return expect(SettingsService.create({},{}))
        .to.eventually.have.property('movieDirectory', '/dev/test');
    });

    it('should reject if unsuccessful', () =>{
      app.set('configLocation', '/bad')
      return expect(SettingsService.create({},{}))
        .to.eventually.be.rejected;
    });
  });

  describe('#find', () => {
    it('should resolve with settings object if settings exist', () => {
      app.set('settings', { movieDirectory: '/dev/test/no/file' });
      return expect(SettingsService.find({}))
        .to.eventually.have.property('movieDirectory', '/dev/test/no/file');
    });

    it('should reject with settings object if settings exist', () => {
      app.set('settings', undefined);
      app.set('configLocation', '/good')
      return expect(SettingsService.find({}))
        .to.eventually.have.property('movieDirectory', '/dev/test');
    });
  });

  describe('#find', () => {
    it('should resolve with specific setting if settings exist', () => {
      app.set('settings', { movieDirectory: '/dev/test/get/file' });
      return expect(SettingsService.get('movieDirectory'))
        .to.eventually.eq('/dev/test/get/file');
    });
  });

  describe('#update', () => {
    it('should resolve with settings object if successful', () => {
      app.set('configLocation', '/good');
      return SettingsService.update(1, {}).then(() => expect(this.writeFileStub)
        .to.be.calledWith('/good/config.json'));
    });

    it('should reject if unsuccessful', () =>{
      app.set('configLocation', '/bad')
      return expect(SettingsService.update(1, {}))
        .to.be.rejected;
    });
  });

  describe('#patch', () => {
    it('should call update with updated settings object', () => {
      app.set('configLocation', '/good');
      return SettingsService.patch('movieDirectory', { movieDirectory: "/new/directory"}).then(() => 
        expect(SettingsService.update)
          .to.be.calledWith('movieDirectory', { movieDirectory: "/new/directory"}));
    });
  });
});
