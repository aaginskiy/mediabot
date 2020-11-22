"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const logger_1 = __importDefault(require("../logger"));
const logger = new logger_1.default('MetadataEditor');
const safeTrackParameters = [
    'title',
    'language',
    'trackType',
    'codecType',
    'audioChannels',
    'bps',
    'isDefault',
    'isEnabled',
    'isForced',
    'isMuxed',
    '',
];
function checkEntry(track, entries) {
    return entries.reduce((accumulater, condition) => {
        if (typeof condition.value === 'object') {
            logger.warn('Skipping condition check: value must not be an object ');
            return accumulater;
        }
        const key = 'check' + condition.type;
        return isValidChecker(key) && validParameter(condition.parameter)
            ? accumulater && checkers[key](track, condition.parameter, condition.value)
            : accumulater;
    }, true);
}
function checkTrackRule(track, rule) {
    if (checkEntry(track, rule.conditions)) {
        return checkEntry(track, rule.actions);
    }
    else {
        logger.verbose('Skipping rule: conditions did not match');
        return true;
    }
}
function buildValue(entries, movie) {
    return entries.map((entry) => {
        if (typeof entry.value === 'object') {
            entry.value = lodash_1.get(movie, entry.value.path);
        }
        return entry;
    });
}
function checkRules(movie, rules) {
    logger.info(`Checking metadata for movie (ID: ${movie.filename})`);
    if (!rules)
        return true;
    let checkStatus = true;
    rules.forEach((rule) => {
        rule.conditions = buildValue(rule.conditions, movie);
        rule.actions = buildValue(rule.actions, movie);
        if (rule.type === 'track' && movie.mediaFiles) {
            movie.mediaFiles.tracks.forEach((track) => {
                checkStatus = checkStatus && checkTrackRule(track, rule);
            });
        }
    });
    return checkStatus;
}
function executeTrackRule(track, rule) {
    let modifiedTrack = track;
    if (checkEntry(track, rule.conditions)) {
        rule.actions.forEach((action) => {
            if (typeof action.value === 'object') {
                logger.warn('Skipping condition check: value must not be an object ');
                return true;
            }
            const key = 'execute' + action.type;
            if (isValidExecutor(key))
                modifiedTrack = executors[key](modifiedTrack, action.parameter, action.value);
        });
    }
    return modifiedTrack;
}
function executeRules(movie, rules) {
    if (!rules)
        return movie;
    rules.forEach((rule) => {
        rule.conditions = buildValue(rule.conditions, movie);
        rule.actions = buildValue(rule.actions, movie);
        if (rule.type === 'track' && movie.mediaFiles) {
            movie.mediaFiles.tracks = movie.mediaFiles.tracks.map((track) => {
                return executeTrackRule(track, rule);
            });
        }
    });
    return movie;
}
const checkers = {
    checkSet,
    checkRemove,
    checkEql,
    checkNotEql,
};
function checkSet(track, parameter, value) {
    return validParameter(parameter) ? lodash_1.get(track, parameter) === value : true;
}
function validParameter(parameter) {
    if (parameter === undefined) {
        logger.warn(`Skipping check 'checkSet': requires '${parameter}' to exist`);
        return false;
    }
    else if (!safeTrackParameters.includes(parameter)) {
        logger.warn(`Skipping check 'checkSet': '${parameter}' is not valid`);
        return false;
    }
    else {
        return true;
    }
}
function checkRemove(track, _parameter, _value) {
    return lodash_1.get(track, 'isMuxed') === false;
}
function isValidChecker(key) {
    return key in checkers;
}
function checkEql(track, parameter, value) {
    return lodash_1.get(track, parameter) === value;
}
function checkNotEql(track, parameter, value) {
    return lodash_1.get(track, parameter) !== value;
}
/** Executors */
const executors = {
    executeSet,
    executeRemove,
};
function executeSet(track, parameter, value) {
    return lodash_1.set(track, parameter, value);
}
function executeRemove(track, _parameter, _value) {
    return lodash_1.set(track, 'isMuxed', false);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isValidExecutor(key) {
    return key in executors;
}
exports.default = {
    checkTrackRule,
    checkRules,
    executeTrackRule,
    executeRules,
    checkNotEql,
    checkEntry,
};
