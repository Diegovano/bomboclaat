'use strict';

import { getQueue } from '../../audio';
import { bomboModule, VoiceCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { logError } from '../../log';

export const module: bomboModule = {
  name: 'seek',
  description: 'Seeks innit',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  slashCommand: new SlashCommandSubcommandBuilder().addIntegerOption(option => option.setName('value').setDescription('Amount of seconds to seek').setRequired(true)),
  async execute (interaction: VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    // if (args[0].includes(`+`) || args[0].includes(`f`)) return currentQueue.seek(args[0].replace(/[+f]/g, ``), true);
    // if (args[0].includes(`-`) || args[0].includes(`b`)) return currentQueue.seek(-args[0].replace(/[-b]/g, ``), true);

    currentQueue.seek(interaction.options.getInteger('value', true)).then(res => {
      interaction.reply(res);
    }).catch(err => { logError(err); });
  }
};
