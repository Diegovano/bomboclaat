'use strict';

import { getQueue } from '../../audio';
import { logError } from '../../log';
import { bomboModule, VoiceCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

const DEFAULT_VOLUME = 0.15;

export const module: bomboModule = {
  name: 'volume',
  description: 'earrape',
  slashCommand: new SlashCommandSubcommandBuilder().addIntegerOption(option => option.setRequired(true).setName('level').setDescription('volume level')),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    const vol = interaction.options.getInteger('level', true);
    try {
      await currentQueue.setVolume(vol * DEFAULT_VOLUME);
      interaction.reply(`Changed the volume to ${vol}.`);
      return;
    } catch (error) {
      error.message = `What u trying to change the volume of idiot? ${error.message}`;
      logError(error);
    }
  }
};
