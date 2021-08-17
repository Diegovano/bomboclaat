'use strict';

import { getQueue } from '../audio';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'remove',
  description: 'Gets rid of a track in the queue',
  slashCommand: new SlashCommandBuilder().addIntegerOption(option => option.setName('position').setDescription('position to remove').setRequired(true)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.remove(interaction.options.getInteger('position', true) - 1).then(msg => {
      interaction.reply(msg);
    }, err => {
      interaction.reply(`Error removing track! ${err.message}`);
      // err.message = `WARNING: Error removing track ${err.message}`;
      // l.logError(err);
    });
  }
};
