'use strict';

import { getQueue } from '../../audio';
import { bomboModule, VoiceCInteraction } from '../../types';
import { logError } from '../../log';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'move',
  description: 'Moves a track to a certain position in the queue',
  slashCommand: new SlashCommandSubcommandBuilder().addIntegerOption(option => option.setName('from').setDescription('Move track from').setRequired(true))
    .addIntegerOption(option => option.setName('to').setDescription('Move track to').setRequired(true)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    const from = interaction.options.getInteger('from', true);
    const to = interaction.options.getInteger('to', true);

    currentQueue.move(from - 1, to - 1).then(msg => {
      if (msg) interaction.reply(msg);
    }, err => {
      err.message = `WARNING: Cannot move tracks! ${err.message}`;
      logError(err);
      interaction.reply('Cannot move track!');
    });
  }
};
