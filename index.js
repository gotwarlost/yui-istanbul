/*
 Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*jslint nomen: true*/
var path = require('path'),
    yuiRegexp = /yui-nodejs\.js$/;

/**
 * returns the basic transform for YUI load
 * @param matchFn the match function
 * @param transformFn the transform function
 * @param verbose true for verbose logging
 * @return {Function} a function of the form `Fn(originalCode, url)` that returns the
 *  potentially transformed code or the original as necesary.
 */
function getBasicHook(matchFn, transformFn, verbose) {
    return function (data, url) {
        var changed;
        if (matchFn(url) || matchFn(path.resolve(url))) { //allow for relative paths as well
            if (verbose) { console.log('Transforming [' + url + ']'); }
            try {
                changed = transformFn(data, url);
            } catch (ex) {
                console.error('Error transforming: ' + url + ' return original code');
                console.error(ex.message || ex);
                if (ex.stack) { console.error(ex.stack); }
            }
        }
        return changed || data;
    };
}

/**
 * hooks the YUI loader cleanly for v3.9 and above
 * @param YUI the YUI object
 * @param matchFn the match function
 * @param transformFn the transform function
 * @param verbose true for verbose logging
 */
function yuiHook(YUI, matchFn, transformFn, verbose) {
    if (verbose) { console.log('Applying YUI post-load hook'); }
    YUI.setLoadHook(getBasicHook(matchFn, transformFn, verbose));
}
/**
 * hooks the YUI loader by force for versions less than v3.9
 * @param YUI the YUI object
 * @param matchFn the match function
 * @param transformFn the transform function
 * @param verbose true for verbose logging
 */
function legacyHook(YUI, matchFn, transformFn, verbose) {
    var origGet,
        basicHook = getBasicHook(matchFn, transformFn, verbose),
        loaderFn = YUI.Env && YUI.Env.mods && YUI.Env.mods['loader-base'] ? YUI.Env.mods['loader-base'].fn : null;

    if (!loaderFn) { return; }
    if (verbose) { console.log('Applying legacy YUI post-load hook'); }
    YUI.Env.mods['loader-base'].fn = function (Y) {
        loaderFn.call(null, Y);
        origGet = Y.Get._exec;
        Y.Get._exec = function (data, url, cb) {
            return origGet.call(Y, basicHook(data, url), url, cb);
        };
        return Y;
    };
}

module.exports = function (matchFn, transformFn, verbose) {
    return function (file) {
        if (!file.match(yuiRegexp)) {
            return;
        }
        var YMain = require(file),
            YUI = YMain.YUI;
        if (typeof YUI.setLoadHook === 'function') {
            yuiHook(YUI, matchFn, transformFn, verbose);
        } else {
            legacyHook(YUI, matchFn, transformFn, verbose);
        }
    };
};

