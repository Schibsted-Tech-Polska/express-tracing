/* jshint node:true */
/* global describe, it */

'use strict';

var tracing = require('../lib/tracing');
var assert = require('assert');
var moment = require('moment');

describe('Tracing', function () {

    it('middleware should set correlation header when missing', function () {
        var middleware = tracing();
        var req = {
            headers: {}, on: function () {
            }
        };

        middleware(req, {}, function () {});

        assert.equal(req.headers['x-correlation-id'].length, 32);
    });

    it('middleware should not override existing correlation header', function () {
        var middleware = tracing();
        var req = {
            headers: {'x-correlation-id': 'test'}, on: function () {
            }
        };

        middleware(req, {}, function () {
        });

        assert.equal(req.headers['x-correlation-id'], 'test');
    });

    it('middleware should log incoming request when logger and component specified', function () {
        var logger = {
            out: '',
            write: function (text) {
                this.out += text;
            }
        };
        var clock = {
            now: function () {
                return moment('2015-04-01T16:42:23');
            }
        };
        var middleware = tracing({logger: logger, clock: clock, component: 'test_component'});

        var request = {
            headers: {'x-correlation-id': '12341234'},
            on: function (event, callback) {
                if(event === 'end') {
                    callback();
                }
            },
            path: '/api',
            method: 'GET'
        };

        middleware(request, {} /* response - irrelevant */, function () {} /* next - irrelevant */);

        assert.equal(logger.out, '01-04-2015 16:42:23.000 12341234 test_component heroku /api GET incoming\n' +
                                 '01-04-2015 16:42:23.000 12341234 test_component heroku /api GET outgoing\n');
    });

    it('should generate tracing message with appropriate format', function () {
        var options = {
            date: moment([2015, 1, 10, 23, 59, 55, 675]),
            component: 'component',
            req: {
                path: '/api/mostRead',
                method: 'GET',
                headers: {'x-correlation-id': '12cf505c-81d4-4132-be08-be35a9e08592'}
            }
        };
        var tracingMessage = tracing.message(options);

        assert.equal(tracingMessage, '10-02-2015 23:59:55.675 12cf505c-81d4-4132-be08-be35a9e08592 component heroku /api/mostRead GET incoming\n');
    });

    it('should notify about missing fields', function () {
        var options = {
            req: {path: '/api/mostRead', method: 'GET'}
        };
        var tracingMessage = tracing.message(options);

        assert.equal(tracingMessage, 'no-date no-time no-correlation-id no-component heroku /api/mostRead GET incoming\n');
    });

    it('should handle undefined options', function () {
        var tracingMessage = tracing.message();

        assert.equal(tracingMessage, '');
    });

    it('should handle empty options', function () {
        var tracingMessage = tracing.message({});

        assert.equal(tracingMessage, '');
    });

    it('should generate uuid', function () {
        assert.equal(tracing.uuid().length, 32);
        assert.equal(tracing.uuid()[12], 4);
    });

});
