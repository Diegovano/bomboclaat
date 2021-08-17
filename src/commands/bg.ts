'use strict';
import { bomboModule } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'bg',
  description: 'Self encouragement!',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction) {
    switch (interaction.user.id) {
      case '620196939572576258': interaction.reply('We don\'t care about your opinion Hugo.'); break; // PBS
      case '244920561443012608': interaction.reply('En effet, c\'est toi le moins beau du monde entier'); break; // Hectah
      case '795261511647100968': interaction.reply('Puta Troya de Mierda'); break; // Gab
      case '578050897092018196': interaction.reply('poooooop'); break; // Remy
      case '410174833154850816': interaction.reply('t pas cool mais la Picardie ce l\'est'); break;// Clovis
      default: interaction.reply('Decidément.');
    }
  }
};
