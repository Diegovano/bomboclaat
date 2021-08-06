'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'leave', // If this name is changed, change the function call in the clear.js command file.
  aliases: ['quit', 'bye'],
  description: 'Tells the bot to disconnect from the voice channel.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild || !message.member) return;
    const currentQueue = getQueue(message.guild);

    const queueVoiceChannel = await currentQueue.activeVoiceChannel;
    const userVoiceChannel = message.member.voice.channel;

    // If the bot isn't in a voiceChannel, don't execute any other code
    if (!queueVoiceChannel) return;

    // Compare the voiceChannels
    if (userVoiceChannel === queueVoiceChannel) {
      currentQueue.disconnect();
    } else {
      message.reply('Connect to the same voice channel as me to get me to leave!');
    }
  }
};
