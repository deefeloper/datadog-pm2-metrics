var pm2 = require('pm2');

/**
 *  @param cb ((err, result) => {})
 */
function collectPm2Metrics (cb) {
  pm2.list(function (err, result) {
    if (err) {
      return cb(err);
    }

    var retVal = result.map(function (pm2Entry) {
      return {
        pm_id    : pm2Entry.pm_id,
        name     : pm2Entry.name,
        pid      : pm2Entry.pid,
        exec_mode: pm2Entry.pm2_env.exec_mode,
        metrics: {
          instances: pm2Entry.pm2_env.instances,
          cpu      : pm2Entry.monit.cpu,
          memory   : pm2Entry.monit.memory
        }
      };
    });

    cb(null, retVal);
  });
}

exports.collectPm2Metrics = collectPm2Metrics;
