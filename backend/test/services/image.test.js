const assert = require('assert');
const app = require('../../src/app');

describe('\'image\' service', () => {
  it('registered the service', () => {
    const service = app.service('image');

    assert.ok(service, 'Registered the service');
  });
});
