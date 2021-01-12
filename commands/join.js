'use strict';

const am = require('../audio.js');
const l = require('../log.js');

module.exports = {
  name: 'join',
  aliases: ['j', 'hello', 'hi'],
  description: 'Tell the bot to join your voice channel.',
  voiceConnection: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    if (!currentQueue.setVoiceChannel(message.member.voice.channel)) {
      l.logError(Error('WARNING: Cannot join voice channel'));
    }
  }
};
