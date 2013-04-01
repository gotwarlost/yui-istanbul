#!/usr/bin/env node

var rimraf = require('rimraf'),
    path = require('path'),
    async = require('async'),
    fs = require('fs'),
    existsSync = fs.existsSync || path.existsSync,
    child_process = require('child_process'),
    assert = require('assert');

function runTests(dir, callback) {
    var base = path.resolve(__dirname, dir),
        outputDirs = [ path.resolve(base, 'coverage'), path.resolve(base, 'node_modules') ];
    outputDirs.forEach(function (d) {
        console.log('Clean ' + d);
        rimraf.sync(d);
    });
    console.log('Run: npm install for ' + base);
    child_process.exec('npm install', { cwd: base }, function (err) {
        if (err !== null) { return callback(err); }
        console.log('Run: npm test for ' + base);
        child_process.exec('npm test', { cwd: base }, callback);
    });
}

function makeCallback(dir, re) {
    var coverageDir = path.resolve(__dirname, dir, 'coverage'),
        coverageFile = path.resolve(coverageDir, 'coverage.json');

    return function (cb, err, stdout) {
        var json,
            keys;

        if (err) {
            throw err;
        }
        stdout = stdout.toString();
        assert.ok(stdout.match(re, 'Did not find message hook'));
        assert.ok(existsSync(coverageFile), 'Could not find coverage file');
        json = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        keys = Object.keys(json).filter(function (p) { var file = path.basename(p); return file === 'json-stringify.js'; });
        assert.ok(keys.length > 0, 'Could not find coverage info for json-stringify');
        cb();
    };
}

var legacyDir = 'legacy',
    legacyCallback = makeCallback(legacyDir, /Applying legacy YUI post-load hook/),
    xfaceDir = 'xface',
    xfaceCallback = makeCallback(xfaceDir, /Applying YUI post-load hook/);

async.series([
    function (cb) {
        var fn = require('../index');
        assert.ok(typeof fn === 'function');
        assert.ok(typeof fn.yuiHook === 'function');
        assert.equal(3, fn.length);
        assert.equal(4, fn.yuiHook.length);
        process.nextTick(cb);
    },
    function (cb) {
        runTests(legacyDir, legacyCallback.bind(null, cb));
    },
    function (cb) {
        runTests(xfaceDir, xfaceCallback.bind(null, cb));
    }
], function () { console.log('All tests passed'); });


