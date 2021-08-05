'use strict';

import { appendFile, mkdir } from 'fs';

function pad (num: number) {
  let s = num.toLocaleString() + '';
  while (s.length < 2) s = '0' + s;
  return s;
}

export async function log (text: string): Promise<void> {
  const dateOb = new Date();

  console.log(`[${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}] INFO: ${text}`);
}

export async function logError (error: Error): Promise<void> {
  const dateOb = new Date();

  console.error(`[${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}] ${error.message}`);

  appendFile(`./logs/${dateOb.getFullYear()}-${pad(dateOb.getMonth() + 1)}-${pad(dateOb.getDate())}.log`, `${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}\n${error.stack}\n\n`, function (appErr) {
    if (appErr) {
      if (appErr) log('Cannot create file in ./logs directory. Attempting to create!');

      mkdir('./logs', (dirErr) => {
        if (dirErr) {
          logError(Error(`SEVERE: Unable to write to ./logs directory! ${appErr.message}`));
          logError(Error(`SEVERE: Unable to create ./logs directory! ${dirErr.message}`));
        }

        log('./logs directory successfully created!');
        appendFile(`./logs/${dateOb.getFullYear()}-${pad(dateOb.getMonth() + 1)}-${pad(dateOb.getDate())}.log`, `${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}\n${error.stack}\n\n`, function (appErr) {
          if (appErr) throw Error('FATAL: CANNOT LOG ERRORS');
        });
      });
    }
  });
}
