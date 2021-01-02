'use strict';

const am = require('../audio.js');

module.exports = {
  name: 'loop',
  aliases: ['l', 'replay', 'again'],
  description: 'Toggle between no loop, track loop and queue loop',
  guildOnly: true,
  voiceConnection: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    if (!currentQueue.loopTrack && !currentQueue.loopQueue) {
      currentQueue.toggleTrackLoop();
      message.channel.send('Now looping this track!');
    } else if (currentQueue.loopTrack) {
      currentQueue.toggleTrackLoop();
      currentQueue.toggleQueueLoop();
      message.channel.send('Now looping the queue!');
    } else {
      currentQueue.toggleQueueLoop();
      message.channel.send('Looping disabled!');
    }
  }
};
