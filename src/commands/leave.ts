'use strict';

import { getQueue } from '../audio';
import { bomboModule, GuildCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'leave', // If this name is changed, change the function call in the clear.js command file.
  description: 'Tells the bot to disconnect from the voice channel.',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:GuildCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    const queueVoiceChannel = await currentQueue.activeVoiceChannel;
    const userVoiceChannel = interaction.member.voice.channel;

    // If the bot isn't in a voiceChannel, don't execute any other code
    if (!queueVoiceChannel) return interaction.reply({ content: 'I\'m not in a voice chat stoopid', ephemeral: true });

    // Compare the voiceChannels
    if (userVoiceChannel === queueVoiceChannel) {
      await currentQueue.disconnect();
      interaction.reply('Bye Bye!');
    } else {
      interaction.reply({ content: 'Connect to the same voice channel as me to get me to leave!', ephemeral: true });
    }
  }
};
