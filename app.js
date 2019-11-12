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

app.get('/get', async function (req, res, next) {
    var parsed = await csv().fromStream(request.get('http://fridaysforfuture.de/map/mapdata-29.csv'));
    res.status(200).send({
        success: 'true',
        message: parsed
    });
});


module.exports = app;
