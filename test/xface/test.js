var YUI = require('yui').YUI;

YUI({ filter: 'raw' }).use('json-stringify', function (Y) {
    console.log(Y.JSON.stringify({ foo: 'bar'}));
});

