"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const feathers_hooks_common_1 = require("feathers-hooks-common");
const errors_1 = require("@feathersjs/errors");
const app_1 = __importDefault(require("../../app"));
exports.default = {
    before: {
        all: [],
        find: [],
        get: [],
        create: [
            feathers_hooks_common_1.required('name'),
            feathers_hooks_common_1.keep('name', 'args'),
            feathers_hooks_common_1.alterItems((rec) => {
                rec.status = 'queued';
                rec.progress = 0;
                switch (rec.name) {
                    case 'scanMediaLibrary':
                        rec.priority = 'high';
                        rec.function = 'scanMediaLibrary';
                        rec.args = [app_1.default.get('movieDirectory')];
                        break;
                    case 'addMovie':
                        rec.priority = 'high';
                        rec.function = 'addMovie';
                        break;
                    case 'refreshMovie':
                        rec.priority = 'high';
                        rec.function = 'refreshMovie';
                        break;
                    case 'refreshAllMovies':
                        rec.priority = 'high';
                        rec.function = 'refreshAllMovies';
                        rec.args = [app_1.default.get('movieDirectory')];
                        break;
                    case 'autoFixMovie':
                        rec.priority = 'normal';
                        rec.function = 'autoFixMovie';
                        break;
                    case 'autoScrapeMovie':
                        rec.priority = 'high';
                        rec.service = 'media-scraper';
                        rec.function = 'autoScrapeMovie';
                        break;
                    case 'scanScrapeSingleMovieByTmdbId':
                        rec.priority = 'low';
                        rec.function = 'scanScrapeSingleMovieByTmdbId';
                        break;
                    default:
                        throw new errors_1.NotImplemented(`Command '${rec.name}' is not implemented.`);
                }
                return rec;
            }),
        ],
        update: [feathers_hooks_common_1.disallow()],
        patch: [feathers_hooks_common_1.disallow('external'), feathers_hooks_common_1.keep('status', 'progress', 'statusMessage')],
        remove: [],
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
