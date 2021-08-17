'use strict';

import { getQueue } from '../audio';
import { bomboModule, GuildCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'bind',
  description: 'Bind the bot to this text channel.',
  dmCompatible: false,
  slashCommand: new SlashCommandBuilder(),
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction:GuildCInteraction) {
    const currentQueue = getQueue(interaction.guild);
    if (interaction.guild.me && interaction.channel.permissionsFor(interaction.guild.me).has('SEND_MESSAGES')) {
      currentQueue.textChannel = interaction.channel;
      interaction.reply('Bound!');
    } else interaction.reply({ content: `Could not bind bot to ${interaction.channel.name} in server ${interaction.guild.name}! Insufficient permissions!`, ephemeral: true });
  }
};
