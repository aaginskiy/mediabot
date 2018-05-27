const assert = require('assert');
const app = require('../../src/app');

describe('\'Movies\' service', () => {
  it('registered the service', () => {
    const service = app.service('movies');

    assert.ok(service, 'Registered the service');
  });
});
