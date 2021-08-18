'use strict';

import { getQueue } from '../audio';
import { bomboModule, GuildCInteraction } from '../types';
import { logError } from '../log';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'queue',
  description: 'Print a list of the track added to the queue since the bot joined the voice channel.',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: false,
  voiceConnection: false,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:GuildCInteraction) {
    getQueue(interaction.guild).getQueueMessage().then(messageContent => {
      if (typeof messageContent === 'string') return interaction.reply(messageContent);
      interaction.reply({ embeds: messageContent }).catch(err => {
        interaction.reply('Unable to send queue message');
        err.message = `WARNING: Cannot send queue embeds! ${err.message}`;
        logError(err);
      });
    }, err => {
      interaction.reply('Unable to get queue message');
      err.message = `WARNING: Cannot get queue message! ${err.message}`;
      logError(err);
    });
  }
};
