'use strict';

var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var cp = require('child_process');

module.exports = () => {

  var run = (job, done) => {
    var constructScript = (next) => {
      job.status = 'running';
      next();
    };
    var runcommand = (next) => {
      var command = __dirname + '/test.sh';
      cp.exec(
        command, {
          cwd: __dirname
        },
        (err, stdout, stderr) => {
          if (err) {
            job.status = 'failed';
            return next(new Error('script failed'));
          }
          console.log(stdout);
          job.status = 'success';
          next();
        });
    };

    async.series([
      constructScript,
      runcommand
    ], (err) => {
      done(err);
    });
  };
  return {
    run: run
  };
};
