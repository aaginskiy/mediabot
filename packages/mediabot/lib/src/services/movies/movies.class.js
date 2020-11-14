"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movies = void 0;
const feathers_nedb_1 = require("feathers-nedb");
class Movies extends feathers_nedb_1.Service {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options, app) {
        super(options);
    }
}
exports.Movies = Movies;
