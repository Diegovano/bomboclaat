'use strict';

import { getQueue } from '../../audio';
import { logError } from '../../log';
import { bomboModule, VoiceCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'skip',
  description: 'Skips the current track',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  slashCommand: new SlashCommandSubcommandBuilder(),
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.skip().then(msg => {
      if (msg) interaction.reply(msg);
    }, err => {
      interaction.reply('Unable to skip track!');
      err.message = `WARNING: Unable to skip track! ${err.message}`;
      logError(err);
    });
  }
};
