import app from '../../src/app';

describe('\'jobs\' service', () => {
  it('registered the service', () => {
    const service = app.service('jobs');
    expect(service).toBeTruthy();
  });
});
