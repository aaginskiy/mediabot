"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nedb_1 = __importDefault(require("nedb"));
const path_1 = __importDefault(require("path"));
function default_1(app) {
    const dbPath = app.get('dataLocation');
    const Model = new nedb_1.default({
        filename: path_1.default.join(dbPath, 'jobs.db'),
        autoload: true,
    });
    return Model;
}
exports.default = default_1;
