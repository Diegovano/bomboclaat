'use strict';

import { config } from '../configFiles';
import { logError } from '../log';
import { bomboModule, GuildCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'autoaccent',
  description: 'Toggle auto-accent mode',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction:GuildCInteraction) {
    const objectHandle = await config.get(interaction.guild);

    if (!objectHandle) throw Error('bomboModule autoAccent: guild config not initialised!');

    objectHandle.autoAccent = !objectHandle.autoAccent;
    config.writeToJSON().then(() => {
      interaction.reply(`${objectHandle.autoAccent ? 'Enabled' : 'Disabled'} auto-accent!`);
    }, err => {
      objectHandle.autoAccent = !objectHandle.autoAccent; // reset to previous
      err.message = `WARNING: Unable to update config file! ${err.message}`;
      logError(err);
    });
  }
};
