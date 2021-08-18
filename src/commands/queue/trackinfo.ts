'use strict';

import { getQueue } from '../../audio';
import { log, logError } from '../../log';
import { bomboModule, VoiceCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'trackinfo',
  description: 'Show info about a track in the queue',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  slashCommand: new SlashCommandSubcommandBuilder().addIntegerOption(option => option.setName('track').setDescription('Get info about the track at the track number').setRequired(false)),
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);
    let arg = interaction.options.getInteger('track');
    if (!arg) {
      arg = currentQueue.queuePos;
    } else {
      arg -= 1;
    }

    currentQueue.infoEmbed(arg).then(embed => {
      if (!embed) return;
      interaction.reply({ embeds: [embed.setAuthor('Bomborastaclaat', interaction.client.user?.displayAvatarURL() ?? '')] })
        .catch(error => {
          error.message = `WARNING: Could not send information embed! ${error.message}`;
          logError(error);
        });
    }, err => {
      log(`Could not find track info! ${err.message}`);
      interaction.reply('error finding track information! Is value in range?');
    });
  }
};
