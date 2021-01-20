'use strict';

const am = require('../audio.js');

module.exports = {
  name: 'remove',
  alisases: ['r'],
  description: 'Gets rid of a track in the queue',
  usage: '<track position>',
  args: true,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    const currentQueue = am.getQueue(message);

    currentQueue.remove(parseInt(args[0]) - 1).then(msg => {
      message.channel.send(msg);
    }, err => {
      message.channel.send(`Error removing track! ${err.message}`);
      // err.message = `WARNING: Error removing track ${err.message}`;
      // l.logError(err);
    });
  }
};
