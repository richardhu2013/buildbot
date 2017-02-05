'use strict'

var server = require('./server')();
server.start(() => {
  console.log('buildbot server started');
});

process.on('SIGINT', () => {
  console.log('buildbot server ' + 'stopping...');
  server.stop(() => {
    console.log('buildbot server ' + 'finished');
  });
});
