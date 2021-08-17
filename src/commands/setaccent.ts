'use strict';

import { config } from '../configFiles';
import { logError } from '../log';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

const languages:[name: string, value: string][] = [['french', 'fr'], ['german', 'de'], ['russian', 'ru'], ['japanese', 'ja'], ['chinese', 'zh'], ['english', 'en'], ['arabic', 'ar'], ['italian', 'it'], ['spanish', 'es'], ['korean', 'ko'], ['portuguese', 'pt'], ['swedish', 'sw'], ['dutch', 'nl'], ['kiwi', 'en_nz'], ['aussie', 'en_au'], ['quebec', 'fr_ca'], ['indian', 'hi'], ['american', 'en_us']];

export const module: bomboModule = {
  name: 'setaccent',
  description: 'Assign yourself an in-chat accent',
  slashCommand: new SlashCommandBuilder().addStringOption(option => option.setName('language').setDescription('The language of the accent you want the text to have').setRequired(true).addChoices(languages)).addStringOption(option => option.setName('text').setDescription('The text itself').setRequired(true)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    config.accentUser(interaction, interaction.options.getString('language', true)).catch((err) => {
      err.message = `WARNING: Could not update user accent! ${err.message}`;
      logError(err);
    });
  }
};
