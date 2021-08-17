'use strict';

import { version } from '../../package.json';
import { log } from '../log';
import { bomboModule } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'version',
  description: 'Display bomoclaat\'s version.',
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: true,
  slashCommand: new SlashCommandBuilder(),
  async execute (interaction) {
    log(`Bomboclaat version ${version}`);
    interaction.reply({ content: `Bomboclaat version ${version}`, ephemeral: true });
  }
};
