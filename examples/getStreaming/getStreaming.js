/**
 * This is an example from the readme.md
 * On windows you should run with PowerShell not git bash.
 * Install
 *   [nodejs](https://nodejs.org/en/)
 *
 * To run:
 *   change directory to this file `cd examples/debug`
 *   do `npm install`
 *   then `npm start`
 */
var debug = false; // Pretty print any bytes in and out... it's amazing...
var verbose = true; // Adds verbosity to functions

const k = require('openbci-utilities').Constants;
var Wifi = require('../../index').Wifi;
var wifi = new Wifi({
  debug: debug,
  verbose: verbose,
  sendCounts: false
});

const sampleFunc = (sample) => {
  try {
    if (sample.valid) {
      console.log(sample.sampleNumber);
    }
  } catch (err) {
    console.log(err);
  }
};

wifi.on('sample', sampleFunc);

wifi.once('wifiShield', (shield) => {
  wifi.connect(shield.ipAddress)
    .then(() => {
      if (wifi.getNumberOfChannels() === 4) {
        console.log("setting sample rate to 1600 for ganglion");
        return wifi.setSampleRate(1600);
      } else {
        console.log("setting sample rate to 1000 for cyton/daisy");
        return wifi.setSampleRate(1000);
      }
    })
    .then(() => {
    console.log("sendign stream start");
      return wifi.streamStart();
    })
    .catch((err) => {
      console.log(err);
    });
  wifi.searchStop().catch(console.log);
});

wifi.searchStart().catch(console.log);

function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    /** Do additional clean up here */
    if (wifi.isConnected()) wifi.disconnect().catch(console.log);
    wifi.removeAllListeners('rawDataPacket');
    wifi.removeAllListeners('sample');
    wifi.destroy();
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    if (wifi.isStreaming()) {
      setTimeout(() => {
        console.log("timeout");
        process.exit(0);
      }, 1000);
      wifi.streamStop()
        .then(() => {
          console.log('stream stopped');
          process.exit(0);
        }).catch((err) => {
          console.log(err);
          process.exit(0);
        });
    }
  }
}

if (process.platform === "win32") {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));