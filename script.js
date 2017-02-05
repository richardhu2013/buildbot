'use strict';

var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var cp = require('child_process');

module.exports = () => {

  var run = (job, done) => {
    var dir = __dirname + '/' + job.jobid;
    var scriptPath = dir + '/script.sh';

    job.status = 'running';

    var mkdir = (next) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      next();
    };

    var genScript = (next) => {
      fs.writeFileSync(scriptPath, job.script);
      fs.chmod(scriptPath, 511, (err) => {
        if (err) {
          return next(new Error('Change permission error'));
        }
        next();
      });
    };

    var runCommand = (next) => {
      var command = scriptPath;
      cp.exec(
        command, {
          cwd: dir,
          env: job.envvars
        },
        (err, stdout, stderr) => {
          if (err) {
            job.status = 'failed';
            fs.writeFileSync(dir + '/run.log', stderr);
            return next(new Error('script failed'));
          }
          fs.writeFileSync(dir + '/run.log', stdout);
          job.status = 'success';
          next();
        });
    };

    async.series([
      mkdir,
      genScript,
      runCommand
    ], (err) => {
      done(err);
    });
  };
  return {
    run: run
  };
};
