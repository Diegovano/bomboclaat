'use strict';

const am = require('../audio.js');
const l = require('../log.js');

const DEFAULT_VOLUME = 0.025;

module.exports = {
  name: 'volume',
  aliases: ['v', 'vol'],
  description: 'earrape',
  args: true,
  usage: '<volume level>',
  voiceConnection: true,
  async execute (message, args) {
    if (Number(args[0]) !== parseFloat(args[0])) return message.channel.send('Please provide a number!');

    const currentQueue = am.getQueue(message);

    try {
      currentQueue.setVolume(args[0] * DEFAULT_VOLUME);
    } catch (error) {
      error.message = `What u trying to change the volume of idiot? ${error.message}`;
      l.logError(error);
    }

    return message.channel.send(`Changed the volume to ${args[0]}.`);
  }
};
