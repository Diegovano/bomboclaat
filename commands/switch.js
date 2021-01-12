'use strict';

const am = require('../audio.js');

module.exports = {
  name: 'switch',
  description: 'The bot will join the voice channel of the requestor.',
  voiceConnection: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    currentQueue.voiceChannel = message.member.voice.channel;
    if (currentQueue.currentTrack) currentQueue.play(currentQueue.timestamp);
  }
};
