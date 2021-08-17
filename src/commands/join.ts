'use strict';

import { getQueue } from '../audio';
import { bomboModule, VoiceCInteraction } from '../types';
import { logError } from '../log';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'join',
  description: 'Tell the bot to join your voice channel.',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.setVoiceChannel(interaction.member.voice.channel).catch(_err => {
      logError(Error('WARNING: Cannot join voice channel'));
    });
  }
};
