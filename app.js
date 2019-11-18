var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const csv = require('csvtojson');
const axios = require('axios');
const NodeCache = require("node-cache");

const responseCache = new NodeCache({
    stdTTL: 600,
    checkperiod: 300,
    deleteOnExpire: true,
    maxKeys: 1
});

const fffURL = "http://fridaysforfuture.de/map/mapdata.csv";

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/fff/v2/get', async function (req, res, next) {
    res.status(200).send(await createResponse());
});

app.get('/fff/v2/search/:parameter/:value', async function (req, res, next) {
    var parameter = req.params.parameter;
    var value = req.params.value;
    var response = await createResponse();

    response['message'] = filterObjects(response['message'], parameter, value);

    res.status(200).send(response);
});

// DEPRECATED

app.get('/fff/v1/get', async function (req, res, next) {
    var parsed = await csv().fromStream(request.get('https://fridaysforfuture.de/map/mapdata.csv'));

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

app.get('/fff/v1/search/:parameter/:value', async function (req, res, next) {
    var parameter = req.params.parameter;
    var value = req.params.value;

    var filtered = [];
    var parsed = await csv().fromStream(request.get('http://fridaysforfuture.de/map/mapdata.csv'));

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

// DEPRECATED END

// FUNCTIONS

function filterObjects(rawResult, parameter, value) {
    var filteredArray = [];

    if (typeof rawResult !== "object") {
        return rawResult;
    }

    for (var a = 0; a < rawResult.length; a++) {
        if (rawResult[a][parameter].includes(value)) {
            filteredArray.push(rawResult[a]);
        }
    }

    return filteredArray;
}

function normalizeURLs(url) {
    if (url === "" || url == null) {
        return "";
    }

    return url.split('?')[0];
}

function createNormalizedObject(rawData) {
    var normalizedArray = [];
    var fork = rawData;

    for (var a = 0; a < fork.length; a++) {
        if (fork[a]['lang'] == "0") continue;
        if (fork[a]['lat'] == "0") continue;

        normalizedArray.push({
            lat: fork[a]['lang'],
            lon: fork[a]['lat'],
            full_info: fork[a]['Name'] + " " + fork[a]['Startpunkt'] + " - " + fork[a]['Uhrzeit'],
            time: fork[a]['Uhrzeit'],
            city: fork[a]['Name'],
            state: fork[a]['Bundesland'],
            start: fork[a]['Startpunkt'],
            additionals: fork[a]['zusatzinfo'],
            facebook: fork[a]['Facebook'],
            facebook_event: normalizeURLs(fork[a]['Facebook event']),
            twitter: normalizeURLs(fork[a]['Twitter']),
            instagram: normalizeURLs(fork[a]['Instagram']),
            website: normalizeURLs(fork[a]['Facebook'])
        })
    }

    return normalizedArray;
}

async function createResponse() {
    var rawCSV = await getRawCSV();

    if (rawCSV['success'] == 'false') {
        return {
            success: rawCSV['success'],
            message: rawCSV['data']
        }
    } else {
        return {
            success: rawCSV['success'],
            message: createNormalizedObject(await csv().fromString(rawCSV['data']))
        }
    }
}

async function getRawCSV() {
    var result;
    var cache = responseCache.get("response");

    if (cache == null) {
        result = await axios.get(fffURL).then(res => {
            responseCache.set("response", res['data']);
            return {
                success: 'true',
                data: res['data']
            }
        }).catch(e => {
            return {
                success: 'false',
                data: e['message'],
            } ;
        });
    } else {
        if (typeof cache === "string") {
            return {
                success: 'true',
                data: cache
            }
        } else {
            responseCache.flushAll();
            return {
                success: 'false',
                data: "Cache has wrong type of object. Invalidated. Try again."
            }
        }
    }

    return result;
}

module.exports = app;
