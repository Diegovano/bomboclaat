'use strict';

import { getQueue } from '../../audio';
import { bomboModule, GuildCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'clear',
  description: 'Clear all tracks from the current queue except the current track.',
  slashCommand: new SlashCommandSubcommandBuilder(),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:GuildCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.clear();
    interaction.reply('Cleared!');
  }
};
