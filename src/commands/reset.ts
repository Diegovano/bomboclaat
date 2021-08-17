'use strict';

import { getQueue } from '../audio';
import { bomboModule, GuildCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'reset',
  description: 'Reset the bot\'s audio systems in this guild!',
  dmCompatible: false,
  voiceConnection: false,
  textBound: true,
  slashCommand: new SlashCommandBuilder(),
  ignoreBotChannel: false,
  async execute (interaction:GuildCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.clean();
  }
};
