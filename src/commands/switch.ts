'use strict';

import { getQueue } from '../audio';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'switch',
  description: 'The bot will join the voice channel of the requestor.',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.voiceChannel = interaction.member.voice.channel;
    if (currentQueue.currentTrack) currentQueue.play(currentQueue.timestamp);
  }
};
