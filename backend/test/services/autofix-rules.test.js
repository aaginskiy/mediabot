const assert = require('assert');
const app = require('../../src/app');

describe('\'autofix-rules\' service', () => {
  it('registered the service', () => {
    const service = app.service('autofix-rules');

    assert.ok(service, 'Registered the service');
  });
});
