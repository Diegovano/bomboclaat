'use strict';

import { getQueue } from '../audio';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'shuffle',
  description: 'figure it out yourself it\'s not rocket science',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  slashCommand: new SlashCommandBuilder(),
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.shuffle().then(response => interaction.reply(response));
  }
};
