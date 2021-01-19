'use strict';

const am = require('../audio.js');
const l = require('../log.js');

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  description: 'Skip the current track.',
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    currentQueue.skip().then(msg => {
      if (msg) message.channel.send(msg);
    }, err => {
      message.channel.send('Unable to skip track!');
      err.message = `WARNING: Unable to skip track! ${err.message}`;
      l.logError(err);
    });
  }
};
