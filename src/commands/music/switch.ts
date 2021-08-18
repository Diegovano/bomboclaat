'use strict';

import { getQueue } from '../../audio';
import { bomboModule, VoiceCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { logError } from '../../log';

export const module: bomboModule = {
  name: 'switch',
  description: 'The bot will join the voice channel of the requestor.',
  slashCommand: new SlashCommandSubcommandBuilder(),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.setVoiceChannel(interaction.member.voice.channel).catch(_err => {
      logError(Error('WARNING: Cannot join voice channel'));
    });
    if (currentQueue.currentTrack) currentQueue.play(currentQueue.timestamp);
  }
};
