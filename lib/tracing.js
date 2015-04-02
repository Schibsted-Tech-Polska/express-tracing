/* jshint node:true */

'use strict'; 

var moment = require('moment');
var util = require('util');

var CORRELATION_ID = 'x-correlation-id';

function middleware(config) {
    config = config || {};

    return function (req, res, next) {
        if (!req.headers[CORRELATION_ID]) {
            req.headers[CORRELATION_ID] = uuid();
        }

        log(req, config, 'incoming');

        req.on('end', function() {
            log(req, config, 'outgoing');
        });

        next();
    };
}

function message(options) {
    if (!options || !options.req) {
        return '';
    }

    var date = (options.date && moment(options.date).format('DD-MM-YYYY HH:mm:ss.SSS')) || 'no-date no-time';
    return util.format('%s %s %s heroku %s %s %s\n',
        date,
        (options.req.headers && options.req.headers[CORRELATION_ID]) || 'no-correlation-id',
        options.component || 'no-component',
        options.req.path,
        options.req.method,
        options.message || 'incoming');
}

// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript - dashes removed - as logstash doesn't like them
function uuid() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function log(req, config, msg) {
    if(config.logger && config.component) {
        config.logger.write(message({
            date: (config.clock && config.clock.now()) || Date.now(),
            component: config.component,
            req: req,
            message: msg
        }));
    }
}

middleware.header = CORRELATION_ID;
middleware.extend = function(request, correlationId) {
    if(request.headers) {
        request.headers[CORRELATION_ID] = correlationId;
    }
};

middleware.uuid = uuid;
middleware.message = message;

module.exports = middleware;