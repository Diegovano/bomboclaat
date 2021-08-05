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
  async execute (message, args) {
    if (!message.guild || !message.member) return;
    const currentQueue = getQueue(message.guild);

    const clientVoiceConnection = currentQueue.connection;
    const userVoiceChannel = message.member.voice.channel;

    // If the bot isn't in a voiceChannel, don't execute any other code
    if (!clientVoiceConnection) {
      if (args[0] !== 'silent') message.reply("I'm not in a voice channel, why are you trying to make me leave?");
      return;
    }


    // Compare the voiceChannels
    if (userVoiceChannel === clientVoiceConnection.channel) {
      // am.deleteQueue(message, true);
      userVoiceChannel.leave();
      currentQueue.pause();
      message.channel.send('Bye! Bye!');
    } else {
      message.reply('We are not in the same voice channel stoopid!');
    }
  }
};
