var DataDogPm2Metrics = require('./lib');

// Start an agent that automatically sends metrics with a 2.5 second delay between runs
var dataDogPm2Metrics = new DataDogPm2Metrics({
  autoPulse    : true,
  pulseInterval: 2500,
  statsDOptions: {
    host: 'test.api.flex-appeal.nl'
  }
});

dataDogPm2Metrics.on('start', function () {
  console.info('Agent started');
});

dataDogPm2Metrics.on('pulse', function () {
  console.info('Pulse!');
});

dataDogPm2Metrics.on('error', function () {
  console.error('An error has occured: ', err)
});
