/* global describe it beforeEach afterEach expect */
const nock = require('nock')

const app = require('../../../app')
app.setup()
const WebhookService = app.service('webhook')

describe("'Webhook' service", () => {
  it('registers the service', () => expect(WebhookService).toBeTruthy())
})
