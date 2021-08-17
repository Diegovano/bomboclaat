'use strict';

import { bomboModule, GuildCInteraction } from '../types';
import { config } from '../configFiles';
import { logError } from '../log';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'prefix',
  description: 'Change the bot\'s prefix for this server',
  slashCommand: new SlashCommandBuilder().addStringOption(option => option.setName('prefix').setDescription('The new prefix').setRequired(true)),
  dmCompatible: false,
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction: GuildCInteraction) {
    const objectHandle = await config.get(interaction.guild);
    if (!objectHandle) throw Error('Guild config not initialised!');

    const prevPrefix = objectHandle.prefix;

    objectHandle.prefix = interaction.options.getString('prefix', true);
    config.writeToJSON().then(() => {
      interaction.reply(`Prefix changed to '${objectHandle.prefix}'`);
    }, err => {
      objectHandle.prefix = prevPrefix; // if unable to write reset to old prefix
      err.message = `WARNING: Unable to update config file! ${err.message}`;
      logError(err);
    });
  }
};
