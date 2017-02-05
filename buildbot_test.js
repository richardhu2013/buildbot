'use strict';

var fs = require('fs');

var buildbotServer;
var buildbotClient = require('nodeunit-httpclient').create({
  host: '127.0.0.1',
  port: 8888,
  path: '/',
  status: 200
});

exports.rest_devices = {

  'buildbot server': (test) => {
    buildbotServer = require('./server.js')();
    buildbotServer.start(test.done);
  },

  'create a new task script will run more than 4 seconds': (test) => {
    buildbotClient.post(
      test,
      'tasks', {
        data: {
          script: fs.readFileSync('./testfiles/test.sh', 'utf8')
        }
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.taskid, 1);
        test.done();
      });
  },

  'check new task script': (test) => {
    buildbotClient.get(
      test,
      'tasks/1', {

      }, (res) => {
        var reply = JSON.parse(res.body);
        test.ok(reply.script.startsWith('#!/bin/'))
        test.done();
      });
  },

  'create new job on task1': (test) => {
    buildbotClient.post(
      test,
      'jobs', {
        data: {
          taskid: 1
        }
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.jobid, 1);
        test.done();
      });
  },

  'check job1 status is running': (test) => {
    buildbotClient.get(
      test,
      'jobs/1/status', {}, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.status, 'running');
        test.done();
      });
  },

  'create task2 in which script will failed immedately': (test) => {
    buildbotClient.post(
      test,
      'tasks', {
        data: {
          script: fs.readFileSync('./testfiles/test1.sh', 'utf8')
        }
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.taskid, 2);
        test.done();
      });
  },

  'create job2 on task2': (test) => {
    buildbotClient.post(
      test,
      'jobs', {
        data: {
          taskid: 2
        }
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.jobid, 2);
        test.done();
      });
  },

  'wait job2 to finish': (test) => {
    setTimeout(test.done, 2000);
  },

  'check job 2 status is failed': (test) => {
    buildbotClient.get(
      test,
      'jobs/2/status', {}, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.status, 'failed');
        test.done();
      });
  },

  'change task2 to use new shell script': (test) => {
    buildbotClient.put(
      test,
      'tasks/2', {
        data: {
          script: fs.readFileSync('./testfiles/test2.sh', 'utf8')
        }
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.result, 'ok');
        test.done();
      });
  },

  'create job3 on task2': (test) => {
    buildbotClient.post(
      test,
      'jobs', {
        data: {
          taskid: 2,
          envvars: {
            VAR1: 'var1 for job3',
            VAR2: 'var2 for job3'
          }
        }
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.jobid, 3);
        test.done();
      });
  },

  'wait job3 to finish': (test) => {
    setTimeout(test.done, 2000);
  },

  'get job3 output log and check envs are set': (test) => {
    buildbotClient.get(
      test,
      'jobs/3/output/run.log', {}, (res) => {
        test.ok(res.body.indexOf('var1 for job3'));
        test.ok(res.body.indexOf('var2 for job3'));
        test.done();
      });
  },

  'deny to create job on non-exist task': (test) => {
    buildbotClient.post(
      test,
      'jobs', {
        data: {
          taskid: 5
        },
      }, {
        status: 404
      }, (res) => {
        var reply = JSON.parse(res.body);
        test.equal(reply.err, 'Invalid taskid')
        test.done();
      });
  },

  'quit buildbot server': (test) => {
    buildbotServer.stop(test.done);
  },
};
