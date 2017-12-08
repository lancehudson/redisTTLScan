#!/usr/bin/env node

const program = require('commander');
const Redis = require('ioredis');

const package = require('./package.json');

program
  .version(package.version)
  .description(package.description)
  .option('-t, --ttl [ttl]', 'Set TTL (seconds till expire)', parseInt)
  .option('-c, --cluster')
  .option('-r, --host [host]', 'host', '127.0.0.1')
  .option('-p, --port [port]', 'port', '6379')
  .option('-k, --match [match]', 'keys regex to scan for')


program.on('--help', () => {
  console.log('  Examples:');
  console.log('');
  console.log('    $ redisTTLScan -cr 192.168.99.100 -k updates:* -t 604800');
  console.log('');
});

program.parse(process.argv);

const scan = async (cluster, host, port, match, updatedTTL) => {
  let redis;
  if (cluster) {
    console.log('Connecting to Cluster');
    redis = new Redis.Cluster([{port: port, host: host}]);
  } else {
    console.log('Connecting to Redis');
    redis = new Redis(port, host);
  }

  let masters;
  if (cluster) {
    masters = redis.nodes('master');
  } else {
    masters = [redis];
  }

  const streamOpts = {};
  if (match) {
    streamOpts.match = match;
  }

  Promise.all(
    masters.map((node) => {
    const stream = node.scanStream(streamOpts);

    return new Promise( async (resolve, reject) => {
      stream.on('data', async (keys) => {
        const keysMissingTTL = [];
        for (let i in keys) {
          let ttl = await redis.ttl(keys[i]);
          if (ttl == -1) {
            keysMissingTTL.push(keys[i]);
          }
        }

        if (keysMissingTTL.length == 0) {
          return;
        }

        if (!updatedTTL) {
          console.log(keysMissingTTL);
        } else {
          await Promise.all(keysMissingTTL.map((key) => {
            console.log(`Setting TTL on ${key}`);
            return redis.expire(key, updatedTTL);
          }));
        }
      });

      stream.on('error', reject);
      stream.on('end', resolve);
    });
  })).then(() => {
    console.log('Done');
    redis.quit();
  });
}

scan(program.cluster, program.host, program.port, program.match, program.ttl);
