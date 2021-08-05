'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';
import { logError } from '../log';

export const module: bomboModule = {
  name: 'join',
  aliases: ['j', 'hello', 'hi'],
  description: 'Tell the bot to join your voice channel.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild || !(message.member?.voice.channel)) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.setVoiceChannel(message.member.voice.channel).catch(_err => {
      logError(Error('WARNING: Cannot join voice channel'));
    });
  }
};
