var request = require('request');

var self;

function MovieDB(apiKey) {
  this.apiKey = apiKey;
  this.base = 'https://api.themoviedb.org/3';
  this.apiUrls = {
    movieInfo: this.base + `/movie/:id?api_key=${this.apiKey}`,
    searchMovie: this.base + `/search/movie?api_key=${this.apiKey}&query=:query`,
  };

  self = this;
  return this;
};

module.exports = function (apiKey) {
  if (apiKey) return new MovieDB(apiKey);
  else throw new Error('Bad TheMovieDB API key');
};


MovieDB.prototype.movie = {
  info: function () {
    var url = self.apiUrls.movieInfo.replace(':id', arguments[0]);

    if (arguments[1] && arguments[1].keys) {
      arguments[1].keys.forEach((key) => {
        url = `${url}&${key}=${arguments[1][key]}`;
      });
    }

    return callAPI(url);
  }
}

MovieDB.prototype.search = {
  movie: function () {
    var url = self.apiUrls.searchMovie.replace(':query', arguments[0]);
    if (arguments[1]) {
      Object.keys(arguments[1]).forEach((key) => {
        url = `${url}&${key}=${arguments[1][key]}`;
      });
    }

    return callAPI(url);
  }
}


function callAPI (url) {
  return new Promise((resolve, reject) => {
    let params = {
      uri: encodeURI(url),
      headers: {
        "Accept": 'application/json'
      }
    };

    request(params, (err, res, body) => {
      var json = null;

      try {
        json = JSON.parse(body);
      } catch (e) {
        reject(e);
        return;
      }

      if (!err && res.statusCode === 200 && !res.status_code) {
        resolve(json);
        return;
      }

      if (res.status_code && [6, 7, 10, 12, 17].includes(res.status_code)) {
        reject(new Error(res));
      } else {
        reject(new Error(err));
      }
    });
  });
}

