const assert = require('assert');
const app = require('../../src/app');

describe('\'Tracks\' service', () => {
  it('registered the service', () => {
    const service = app.service('tracks');

    assert.ok(service, 'Registered the service');
  });
});
