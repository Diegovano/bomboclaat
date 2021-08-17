'use strict';

import { getQueue } from '../audio';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

const languages:[name: string, value: string][] = [['french', 'fr'], ['german', 'de'], ['russian', 'ru'], ['japanese', 'ja'], ['chinese', 'zh'], ['english', 'en'], ['arabic', 'ar'], ['italian', 'it'], ['spanish', 'es'], ['korean', 'ko'], ['portuguese', 'pt'], ['swedish', 'sw'], ['dutch', 'nl'], ['kiwi', 'en_nz'], ['aussie', 'en_au'], ['quebec', 'fr_ca'], ['indian', 'hi'], ['american', 'en_us']];

export const module: bomboModule = {
  name: 'accent',
  description: 'Fuck diegos descriptions',
  slashCommand: new SlashCommandBuilder().addStringOption(option => option.setName('language').setDescription('The language of the accent you want the text to have').setRequired(true).addChoices(languages)).addStringOption(option => option.setName('text').setDescription('The text itself').setRequired(true)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: true,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);
    currentQueue.voiceChannel = interaction.member.voice.channel ?? null;
    currentQueue.queueAccent(<string>interaction.options.getString('language'), <string>interaction.options.getString('text'));
    interaction.reply('Now playing!');
  }
};
