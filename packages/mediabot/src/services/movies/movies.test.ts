import app from '../../app'

describe("'movies' service", () => {
  it('registered the service', () => {
    const service = app.service('movies')
    expect(service).toBeTruthy()
  })
})
