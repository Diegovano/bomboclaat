'use strict';

const fs = require('fs');

function pad (num) {
  let s = num + '';
  while (s.length < 2) s = '0' + s;
  return s;
}

async function log (text) {
  const dateOb = new Date();

  console.log(`[${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}] INFO: ${text}`);
}

async function logError (error) {
  const dateOb = new Date();

  console.error(`[${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}] ${error.message}`);

  fs.appendFile(`./logs/${dateOb.getFullYear()}-${pad(dateOb.getMonth() + 1)}-${pad(dateOb.getDate())}.log`, `${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}\n${error.stack}\n\n`, function (appErr) {
    if (appErr) {
      if (appErr) log('Cannot create file in ./logs directory. Attempting to create!');

      fs.mkdir('./logs', (dirErr) => {
        if (dirErr) {
          logError(`SEVERE: Unable to write to ./logs directory! ${appErr.message}`);
          logError(`SEVERE: Unable to create ./logs directory! ${dirErr.message}`);
        }

        log('./logs directory successfully created!');
        fs.appendFile(`./logs/${dateOb.getFullYear()}-${pad(dateOb.getMonth() + 1)}-${pad(dateOb.getDate())}.log`, `${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}\n${error.stack}\n\n`, function (appErr) {
          if (appErr) throw Error('FATAL: CANNOT LOG ERRORS');
        });
      });
    }
  });
}

exports.log = log;
exports.logError = logError;
