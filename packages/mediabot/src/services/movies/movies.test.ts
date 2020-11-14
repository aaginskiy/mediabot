import app from '../../app'

describe("'movies' service", () => {
  it('registered the service', () => {
    const service = app.service('api/movies')
    expect(service).toBeTruthy()
  })
})
