"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    host: 'localhost',
    port: 3030,
    movieDirectory: '',
    mediaParser: {
        tmdbApiKey: 'fakeapikey',
        movie: {
            include: {
                title: true,
                originalTitle: true,
                tagline: true,
                plot: true,
                rating: false,
                runtime: true,
                year: true,
                certification: true,
                cast: true,
                genres: true,
                artwork: true,
                trailer: true,
                movieset: true,
            },
            source: {
                title: 'tmdb',
                originalTitle: 'tmdb',
                tagline: 'tmdb',
                plot: 'tmdb',
                rating: 'tmdb',
                runtime: 'tmdb',
                year: 'tmdb',
                certification: 'tmdb',
                cast: 'tmdb',
                genres: 'tmdb',
                artwork: 'tmdb',
                trailer: 'tmdb',
                movieset: 'tmdb',
            },
        },
    },
};
