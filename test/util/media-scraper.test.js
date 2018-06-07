/* global describe it beforeEach afterEach before after */
const chai = require('chai')
const sinon = require('sinon')
const nock = require('nock')
const stream = require('stream')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const { expect } = chai
chai.should()

const fs = require('fs')

var options = {
  'movie': {
    'include': {
      'title': true,
      'originalTitle': true,
      'tagline': true,
      'plot': true,
      'rating': false,
      'runtime': true,
      'year': true,
      'certification': true,
      'cast': true,
      'genres': true,
      'artwork': true,
      'trailer': true,
      'movieset': true
    },
    'source': {
      'title': 'tmdb',
      'originalTitle': 'tmdb',
      'tagline': 'tmdb',
      'plot': 'tmdb',
      'rating': 'tmdb',
      'runtime': 'tmdb',
      'year': 'tmdb',
      'certification': 'tmdb',
      'cast': 'tmdb',
      'genres': 'tmdb',
      'artwork': 'tmdb',
      'trailer': 'tmdb',
      'movieset': 'tmdb'
    }
  }
}

var MediaScraper = require('../../src/util/media-scraper')(options)
var MediaScraperNoOptions = require('../../src/util/media-scraper')()

describe('\'Scrape\' service', () => {
  it('registered the service with options', () =>
    expect(MediaScraper.options, 'Registered the service').to.not.be.empty)

  it('registered the service with no options', () =>
    expect(MediaScraperNoOptions.options, 'Registered the service').to.be.empty)

  describe('#downloadImage', () => {
    beforeEach(done => {
      this.readableStream = new stream.PassThrough()
      nock('https://api.themoviedb.org/3')
        .get('/movie/550')
        .reply(200, function (uri, requestBody) {
          return this.readableStream
        })

      nock('https://api.themoviedb.org/3')
        .get('/search/movie')
        .reply(404)

      this.stream = new stream.PassThrough()

      this.createWriteStreamStub = sinon.stub(fs, 'createWriteStream').yields(new Error('fs.createWriteStream File note found Stubbed Error.'))
      this.createWriteStreamStub.withArgs('/good/filename.nfo').returns(this.stream)

      done()
    })

    afterEach(done => {
      fs.createWriteStream.restore()
      nock.cleanAll()
      done()
    })

    it('should resolve if writing file is successful', () => {
      setTimeout(() => this.stream.emit('close'), 10)
      return expect(MediaScraper.downloadImage('https://api.themoviedb.org/3/movie/550', '/good/filename.nfo'))
        .to.eventually.be.fulfilled
    })

    it('should reject if image stream has error', () => {
      return expect(MediaScraper.downloadImage('https://api.themoviedb.org/3/search/movie', '/good/filename.nfo'))
        .to.eventually.be.rejected
    })

    it('should reject if file write stream has error', () => {
      setTimeout(() => this.stream.emit('error', new Error()), 10)
      return expect(MediaScraper.downloadImage('https://api.themoviedb.org/3/movie/550', '/good/filename.nfo'))
        .to.eventually.be.rejected
    })
  })

  describe('when using TMDB MediaScraper by id', () => {
    before(done => {
      this.movieFixture = {
        id: 'tt0137523',
        tmdbid: 550,
        title: 'Fight Club',
        originaltitle: 'Fight Club',
        tagline: 'Mischief. Mayhem. Soap.',
        plot: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
        outline: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
        runtime: 139,
        year: '1999-10-15',
        rating: 8.3,
        genre: [ 'Drama' ],
        studio:
         [ 'Regency Enterprises',
           'Fox 2000 Pictures',
           'Taurus Film',
           'Atman Entertainment',
           'Knickerbocker Films',
           '20th Century Fox',
           'The Linson Company' ]
      }

      this.xmlMovieFixture = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<movie>
  <id>tt0137523</id>
  <tmdbid>550</tmdbid>
  <title>Fight Club</title>
  <originaltitle>Fight Club</originaltitle>
  <tagline>Mischief. Mayhem. Soap.</tagline>
  <plot>A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.</plot>
  <outline>A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.</outline>
  <runtime>139</runtime>
  <year>1999-10-15</year>
  <rating>8.3</rating>
  <genre>Drama</genre>
  <studio>Regency Enterprises</studio>
  <studio>Fox 2000 Pictures</studio>
  <studio>Taurus Film</studio>
  <studio>Atman Entertainment</studio>
  <studio>Knickerbocker Films</studio>
  <studio>20th Century Fox</studio>
  <studio>The Linson Company</studio>
</movie>`

      this.fileWriteStub = sinon.stub(fs, 'writeFile').yields(new Error('fs.writeFile File note found Stubbed Error.'))
      this.fileWriteStub.withArgs('/good/filename.nfo').yields(null, 'success')

      done()
    })

    after(done => {
      fs.writeFile.restore()

      done()
    })

    beforeEach(done => {
      const movieResponse = {'adult': false, 'backdrop_path': '/mMZRKb3NVo5ZeSPEIaNW9buLWQ0.jpg', 'belongs_to_collection': null, 'budget': 63000000, 'genres': [{'id': 18, 'name': 'Drama'}], 'homepage': 'http://www.foxmovies.com/movies/fight-club', 'id': 550, 'imdb_id': 'tt0137523', 'original_language': 'en', 'original_title': 'Fight Club', 'overview': 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.', 'popularity': 36.315959, 'poster_path': '/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg', 'production_companies': [{'id': 508, 'logo_path': '/7PzJdsLGlR7oW4J0J5Xcd0pHGRg.png', 'name': 'Regency Enterprises', 'origin_country': 'US'}, {'id': 711, 'logo_path': '/tEiIH5QesdheJmDAqQwvtN60727.png', 'name': 'Fox 2000 Pictures', 'origin_country': 'US'}, {'id': 20555, 'logo_path': null, 'name': 'Taurus Film', 'origin_country': ''}, {'id': 54051, 'logo_path': null, 'name': 'Atman Entertainment', 'origin_country': ''}, {'id': 54052, 'logo_path': null, 'name': 'Knickerbocker Films', 'origin_country': ''}, {'id': 25, 'logo_path': '/qZCc1lty5FzX30aOCVRBLzaVmcp.png', 'name': '20th Century Fox', 'origin_country': 'US'}, {'id': 4700, 'logo_path': '/A32wmjrs9Psf4zw0uaixF0GXfxq.png', 'name': 'The Linson Company', 'origin_country': ''}], 'production_countries': [{'iso_3166_1': 'DE', 'name': 'Germany'}, {'iso_3166_1': 'US', 'name': 'United States of America'}], 'release_date': '1999-10-15', 'revenue': 100853753, 'runtime': 139, 'spoken_languages': [{'iso_639_1': 'en', 'name': 'English'}], 'status': 'Released', 'tagline': 'Mischief. Mayhem. Soap.', 'title': 'Fight Club', 'video': false, 'vote_average': 8.300000000000001, 'vote_count': 12357}
      const searchResponse = {'page': 1, 'total_results': 1, 'total_pages': 1, 'results': [{'vote_count': 12379, 'id': 550, 'video': false, 'vote_average': 8.3, 'title': 'Fight Club', 'popularity': 36.029108, 'poster_path': '/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg', 'original_language': 'en', 'original_title': 'Fight Club', 'genre_ids': [18], 'backdrop_path': '/mMZRKb3NVo5ZeSPEIaNW9buLWQ0.jpg', 'adult': false, 'overview': 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.', 'release_date': '1999-10-15'}]}

      nock('https://api.themoviedb.org')
        .get('/3/movie/550')
        .query({api_key: '9cc56c731a06623343d19ce2f7a3c982'})
        .reply(200, movieResponse)

      nock('https://api.themoviedb.org')
        .get('/3/movie/12')
        .query({api_key: '9cc56c731a06623343d19ce2f7a3c982'})
        .reply(404)

      nock('https://api.themoviedb.org/3')
        .get('/search/movie')
        .query({api_key: '9cc56c731a06623343d19ce2f7a3c982', query: 'Fight Club', year: '1999'})
        .reply(200, searchResponse)

      nock('https://api.themoviedb.org/3')
        .get('/search/movie')
        .query({api_key: '9cc56c731a06623343d19ce2f7a3c982', query: 'Fight Club', year: '2005'})
        .reply(404)

      sinon.stub(MediaScraper, 'downloadImage')

      done()
    })

    afterEach(done => {
      MediaScraper.downloadImage.restore()
      nock.cleanAll()
      done()
    })

    it('should auto search for movie', () =>
      expect(MediaScraper.autoSearchMovie('Fight Club', 1999))
        .to.eventually.eq(550))

    it('should return an error if auto search fails', () =>
      expect(MediaScraper.autoSearchMovie('Fight Club', 2005))
        .to.eventually.be.rejected)

    it('should set id to imdb_id', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('id', 'tt0137523'))

    it('should set tmdb_id to id', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('tmdbid', 550))

    it('should set title', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('title', 'Fight Club'))

    it('should set original title', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('originaltitle', 'Fight Club'))

    it('should set tagline', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('tagline', 'Mischief. Mayhem. Soap.'))

    it('should set plot', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('plot', 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.'))

    it('should set rating', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('rating', 8.3))

    it('should set runtime', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('runtime', 139))

    it('should set year', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('year', '1999-10-15'))

    it.skip('should set certification', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('certification', 550))

    it.skip('should set cast', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('cast', 550))

    it('should set genres', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('genre')
        .that.is.an('Array')
        .with.lengthOf(1)
        .that.includes.members(['Drama']))

    it('should set studios', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('studio')
        .that.is.an('Array')
        .with.lengthOf(7)
        .that.includes.members(['Regency Enterprises', 'Fox 2000 Pictures']))

    it.skip('should set artwork', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('artwork', 550))

    it('should set poster', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('poster', '/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg'))

    it('should set fanart', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('fanart', '/mMZRKb3NVo5ZeSPEIaNW9buLWQ0.jpg'))

    it.skip('should set trailer', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('trailer', 550))

    it.skip('should set movieset', () =>
      expect(MediaScraper.scrapeTmdbMovie(550))
        .to.eventually.have.property('movieset', 550))

    it('should return an error if scrape fails', () =>
      expect(MediaScraper.scrapeTmdbMovie(12))
        .to.eventually.be.rejected)

    it('should build Kodi NFO', () =>
      expect(MediaScraper.buildXmlNfo(this.movieFixture))
        .to.eq(this.xmlMovieFixture))

    it('should download poster when autoscraping', async () => {
      await MediaScraper.autoScrapeMovie('Fight Club', 1999, '/good/filename.nfo')
      return expect(MediaScraper.downloadImage)
        .to.be.calledWith('https://image.tmdb.org/t/p/original/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg')
    })

    it('should download poster when autoscraping', async () => {
      await MediaScraper.autoScrapeMovie('Fight Club', 1999, '/good/filename.nfo')
      return expect(MediaScraper.downloadImage)
        .to.be.calledWith('https://image.tmdb.org/t/p/original/mMZRKb3NVo5ZeSPEIaNW9buLWQ0.jpg')
    })

    it('should reject autoscrape if steps fail', () =>
      expect(MediaScraper.autoScrapeMovie('Fight Club', 1999, '/bad/filename.nfo'))
        .to.eventually.be.rejectedWith('fs.writeFile File note found Stubbed Error.'))

    it('should autoscrape if steps succeed', () =>
      expect(MediaScraper.autoScrapeMovie('Fight Club', 1999, '/good/filename.nfo'))
        .to.eventually.be.fulfilled)
  })
})
