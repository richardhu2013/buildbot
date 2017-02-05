'use strict';

var fs = require('fs');
var Hapi = require('hapi');
var async = require('async');
var Path = require('path');
var validate = require('./validate');
var _ = require('lodash');

module.exports = () => {

  var tasks = [];
  var jobs = [];
  var currentTaskId = 0;
  var currentJobId = 0;

  var server = new Hapi.Server();
  server.connection({
    host: '127.0.0.1',
    port: 8888
  });

  server.register(require('inert'), (err) => {
    if (err) {
      console.log('Failed to load inert.');
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: {
      file: Path.join(__dirname, './public/index.html')
    }
  });

  server.route({
    method: 'GET',
    path: '/tasks/{taskid}',
    handler: (request, reply) => {
      if (!validate.isNumeric(request.params.taskid)) {
        reply('Invalid task id').code(400);
      } else {
        var task = _.find(tasks, (task) => {
          return (task.taskid === parseInt(request.params.taskid));
        });
        console.log(task);
        if (task !== undefined) {
          reply({
            script: task.script
          });
        } else {
          reply('Task id=' + request.params.taskid + ' does not exist').code(404);
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/tasks',
    handler: (request, reply) => {
      // create a new task id
      currentTaskId++;
      console.log(request.payload);
      var task = {
        taskid: currentTaskId,
        script: request.payload.script
      };
      console.log(task);
      tasks.push(task);
      reply({
        taskid: currentTaskId
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/tasks/{taskid}',
    handler: (request, reply) => {
      if (!validate.isNumeric(request.params.taskid)) {
        reply('Invalid task id').code(400);
      } else {
        var task = _.find(tasks, (task) => {
          return (task.taskid === parseInt(request.params.taskid));
        });
        if (task !== undefined) {
          task.script = request.payload.script;
        } else {
          reply('Task id=' + request.params.taskid + ' does not exist').code(404);
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/jobs',
    handler: (request, reply) => {
      // create a new task id
      var inJob = request.payload;
      if (!inJob.hasOwnProperty('taskid')) {
        return reply('Missing taskid').code(400);
      }
      var task = _.find(tasks, (task) => {
        return (task.taskid === parseInt(inJob.taskid));
      });

      if (task === undefined) {
        return reply('Task id ' + inJob.taskid + 'does not exist').code(404);
      }
      currentJobId++;
      var job = {
        status: 'running',
        taskid: task.taskid,
        script: task.script,
        jobid: currentJobId,
        envars: inJob.envars || {}
      };
      jobs.push(job);
      var script = require('./script.js')();
      script.run(job, () => {
        console.log('job ' + job.jobid + ' finished');
      });
      return reply({
        jobid: currentJobId
      }).code(200);
    }
  });

  server.route({
    method: 'GET',
    path: '/jobs/{jobid}/status',
    handler: (request, reply) => {
      if (!validate.isNumeric(request.params.jobid)) {
        reply('Invalid job id').code(400);
      } else {
        console.log(jobs);
        var foundJob = _.find(jobs, (job) => {
          return (job.jobid === parseInt(request.params.jobid));
        });
        if (foundJob !== undefined) {
          reply({
            status: foundJob.status
          });
        } else {
          return reply('Job id ' + request.params.jobid + ' does not exist').code(404);
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/jobs/{jobid}/output/{path}',
    handler: (request, reply) => {
      if (!validate.isNumeric(request.params.jobid)) {
        reply('Invalid job id').code(400);
      } else {
        var logPath = __dirname + '/' + request.params.jobid + '/' + request.params.path;
        fs.readFile(logPath, (err, data) => {
          if (err) {
            reply({
              err: 'not found'
            }).code(404);
          } else {
            reply(data);
          }
        });
      }
    }
  });
  var start = (done) => {
    server.start(done);
  };

  var stop = (done) => {
    async.series([
      (next) => {
        server.stop({
          timeout: 1000
        }, next);
      }
    ], done);
  };

  return {
    start: start,
    stop: stop
  };
};
