'use strict';

const am = require('../audio.js');

module.exports = {
  name: 'clear',
  aliases: ['empty'],
  description: 'Clear all tracks from the current queue except the current track.',
  voiceConnection: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    currentQueue.clear();
  }
};
