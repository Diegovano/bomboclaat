'use strict';

const am = require('../audio.js');

module.exports = {
  name: 'nowplaying',
  description: 'shows the banger currently playing',
  aliases: ['np', 'current', 'playing'],
  voiceConnection: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    message.client.commands.get('trackinfo').execute(message, currentQueue.queuePos);
  }
};
