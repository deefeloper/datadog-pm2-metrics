var util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    pm2          = require('pm2'),
    StatsD       = require('hot-shots');

function DataDogPm2Metrics (options) {
  options = options || {};
  this.statsDOptions = options.statsDOptions || {};

  if (!this.statsDOptions.errorHandler) {
    this.statsDOptions.errorHandler = function (err) {
      this.emit('error', err);
    }.bind(this);
  }

  this.statsDClient = new StatsD(this.statsDOptions);

  if (!options.disableExitHandler) {
    var self = this;

    process.on('exit', function () {
      self.statsDClient.close();
    });
  }

  this.autoPulse     = options.autoPulse || false;
  this.pulseInterval = options.pulseInterval || 5000;
  this.pulseTimer    = null;

  if (this.autoPulse) {
    // Wait a bit for starting so event handlers can be hooked before launch
    setTimeout(function () {
      this.emit('start');

      this.pulse.bind(this)();
    }.bind(this), 100);
  }
}

util.inherits(DataDogPm2Metrics, EventEmitter);

DataDogPm2Metrics.prototype.queueNextPulse = function () {
  // Make sure pulsing is enabled and not running already
  if (!this.autoPulse || this.pulseTimer) {
    return;
  }

  this.pulseTimer = setTimeout(function () {
    this.pulseTimer = null;

    this.pulse();
  }.bind(this), this.pulseInterval);
};

DataDogPm2Metrics.prototype.pulse = function (cb) {
  this.emit('pulse');

  cb = cb || function () {};

  this.collectPm2Metrics(function (err, result) {
    if (err) {
      return this.queueNextPulse.bind(this);
    }

    this.sendPm2MetricsToDatadog(result, this.queueNextPulse.bind(this));
  }.bind(this));
};

/**
 * Get information from pm2 and format it.
 * @param {Pm2Metrics-Callback} cb - The callback that handles the response.
 */
DataDogPm2Metrics.prototype.collectPm2Metrics = function (cb) {
  pm2.list(function (err, result) {
    if (err) {
      return cb(err);
    }

    var retVal = result

      // Filter out pmx modules
      .filter(function (pm2Entry) {
        return !pm2Entry.pm2_env.pmx_module;
      })

      // Format to smaller object
      .map(function (pm2Entry) {
        return {
          pm_id    : pm2Entry.pm_id,
          name     : pm2Entry.name,
          pid      : pm2Entry.pid,
          exec_mode: pm2Entry.pm2_env.exec_mode,
          metrics: {
            running          : pm2Entry.pm2_env.status === 'online',
            instances        : pm2Entry.pm2_env.instances,
            cpu              : pm2Entry.monit.cpu,
            memory           : pm2Entry.monit.memory,
            restarts         : pm2Entry.pm2_env.restart_time,
            unstable_restarts: pm2Entry.pm2_env.unstable_restarts
          }
        };
      });

    cb(null, retVal);
  });
};
/**
 * This callback is displayed as a member of the DataDogPm2Metrics class.
 * @callback Pm2Metrics-Callback
 * @param {object} err   - If an error occured, it will be returned here
 * @param {array} result - An array containing data about processes running in pm2 (returned from collectPm2Metrics)
 */

/**
 * @param {array{Pm2Metrics}} pm2Metrics        - The formatted pm2 metrics
 * @param {SendPm2MetricsToDatadog-Callback} cb - callback called when sending data is complete
 */
DataDogPm2Metrics.prototype.sendPm2MetricsToDatadog = function (pm2Metrics, cb) {
  pm2Metrics.forEach(function (pm2InstanceMetrics) {
    var tags = ['pm2_process', pm2InstanceMetrics.name];


    //this.statsDClient.gauge('pm2_process.running', pm2InstanceMetrics.metrics.running && 1 || 0, tags);
    this.statsDClient.check('pm2_process.running', pm2InstanceMetrics.metrics.running ? this.statsDClient.CHECKS.OK : this.statsDClient.CHECKS.CRITICAL, tags);

    this.statsDClient.gauge('pm2_process.cpu', pm2InstanceMetrics.metrics.cpu, tags);
    this.statsDClient.gauge('pm2_process.memory', pm2InstanceMetrics.metrics.memory, tags);
  }.bind(this));

  this.statsDClient.flushQueue(cb);
};
/**
 * This callback is displayed as a member of the DataDogPm2Metrics class.
 * @callback SendPm2MetricsToDatadog-Callback
 * @param {object} err   - If an error occured, it will be returned here
 * @param {array} result - An array containing data about processes running in pm2
 */

module.exports = DataDogPm2Metrics;
