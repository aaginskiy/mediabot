import app from '../../app'

describe("'jobs' service", () => {
  it('registered the service', () => {
    const service = app.service('api/jobs')
    expect(service).toBeTruthy()
  })
})
