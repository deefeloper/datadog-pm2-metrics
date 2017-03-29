var pm2 = require('pm2');

/**
 * Get information from pm2 and format it.
 * @param {Pm2Metrics-Callback} cb - The callback that handles the response.
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

/**
 * This callback is displayed as a global member.
 * @callback Pm2Metrics-Callback
 * @param {object} err   - If an error occured, it will be returned here
 * @param {array} result - An array containing data about processes running in pm2
 */

exports.collectPm2Metrics = collectPm2Metrics;
