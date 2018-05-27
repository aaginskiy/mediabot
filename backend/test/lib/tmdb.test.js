var chai = require('chai');
const { expect } = chai;

var apiKey = process.env.MOVIEDB_API_KEY || process.env.npm_config_key;

if (!apiKey || apiKey.length === 0) {
  console.log('You have not provided the API key'.red);
  console.log(' Running tests:'.cyan);
  console.log(' npm test --key="{your api key}"'.cyan);
  throw new Error('Missing API key, please `run npm test --key="{your api key}"`');
}

var MovieDB = require('../../src/lib/tmdb')(apiKey);

describe('\'MovieDB\' API', () => {
  describe("#movie", function() {
    it("can get info on a movie", () =>
      expect(MovieDB.movie.info(550))
        .to.eventually.have.property('title', 'Fight Club'));
  });

  describe("#search", function() {
    it("can search for movie", () =>
      expect(MovieDB.search.movie('Jack Reacher', {year: 2016}))
        .to.eventually.have.property('results')
        .that.is.an('Array')
        .with.lengthOf(1)
        .and.include.an.item.with.property('title', 'Jack Reacher: Never Go Back'));
  });
});