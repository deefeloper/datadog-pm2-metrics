var DataDogPm2Metrics = require('./lib');

// Start an agent that automatically sends metrics with a 2.5 second delay between runs
var dataDogPm2Metrics = new DataDogPm2Metrics({
  autoPulse: true,
  pulseInterval: 2500,
  onStart: function () {
    console.info('Agent started');
  },
  onPulse: function () {
    console.info('Pulse!');
  },
  onError: function (err) {
    console.error('An error has occured: ', err)
  }
});
