import app from '../../src/app';

describe('\'image\' service', () => {
  it('registered the service', () => {
    const service = app.service('image');
    expect(service).toBeTruthy();
  });
});
