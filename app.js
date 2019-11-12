var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const csv = require('csvtojson');
const request = require('request');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/fff/get', async function (req, res, next) {
    var parsed = await csv().fromStream(request.get('http://fridaysforfuture.de/map/mapdata-29.csv'));

    for (var a = 0; a < parsed.length; a++) {
        if (parsed[a]['Instagram'] != "") parsed[a]['Instagram'] = normalizeURLs(parsed[a]['Instagram']);
        if (parsed[a]['Facebook event'] != "") parsed[a]['Facebook event'] = normalizeURLs(parsed[a]['Facebook event']);
        if (parsed[a]['Twitter'] != "") parsed[a]['Twitter'] = normalizeURLs(parsed[a]['Twitter']);
        if (parsed[a]['Facebook'] != "") parsed[a]['Facebook'] = normalizeURLs(parsed[a]['Facebook']);
    }

    res.status(200).send({
        success: 'true',
        message: parsed
    });
});

app.get('/fff/search/:parameter/:value', async function (req, res, next) {
    var parameter = req.params.parameter;
    var value = req.params.value;

    var filtered = [];
    var parsed = await csv().fromStream(request.get('http://fridaysforfuture.de/map/mapdata-29.csv'));

    for (var a = 0; a < parsed.length; a++) {
        if (parsed[a]['Instagram'] != "") parsed[a]['Instagram'] = normalizeURLs(parsed[a]['Instagram']);
        if (parsed[a]['Facebook event'] != "") parsed[a]['Facebook event'] = normalizeURLs(parsed[a]['Facebook event']);
        if (parsed[a]['Twitter'] != "") parsed[a]['Twitter'] = normalizeURLs(parsed[a]['Twitter']);
        if (parsed[a]['Facebook'] != "") parsed[a]['Facebook'] = normalizeURLs(parsed[a]['Facebook']);

        if (parsed[a][parameter].includes(value)) {
            filtered.push(parsed[a]);
        }
    }

    res.status(200).send({
        success: 'true',
        message: filtered
    });
});

function normalizeURLs(url) {
    return url.split('?')[0];
}

module.exports = app;
