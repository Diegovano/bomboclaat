'use strict';

import { getQueue } from '../../audio';
import { bomboModule, VoiceCInteraction } from '../../types';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'loop',
  description: 'Toggle between no loop, track loop and queue loop',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  slashCommand: new SlashCommandSubcommandBuilder().addStringOption(option => option.setName('loop').setDescription('Thing to loop').setRequired(false).addChoices([['none', 'none'], ['track', 'track'], ['queue', 'queue']])),
  async execute (interaction:VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);
    const arg = interaction.options.getString('loop');
    if (arg) {
      switch (arg) {
        case 'none': {
          currentQueue.loopTrack = false;
          currentQueue.loopQueue = false;
          interaction.reply('Looping disabled!');
          break;
        }
        case 'track': {
          currentQueue.loopTrack = true;
          currentQueue.loopQueue = false;
          interaction.reply('Now looping this track!');
          break;
        }
        case 'queue': {
          currentQueue.loopTrack = false;
          currentQueue.loopQueue = true;
          interaction.reply('Now looping the queue!');
          break;
        }
      }
    } else {
      if (!currentQueue.loopTrack && !currentQueue.loopQueue) {
        currentQueue.toggleTrackLoop();
        interaction.reply('Now looping this track!');
      } else if (currentQueue.loopTrack) {
        currentQueue.toggleTrackLoop();
        currentQueue.toggleQueueLoop();
        interaction.reply('Now looping the queue!');
      } else {
        currentQueue.toggleQueueLoop();
        interaction.reply('Looping disabled!');
      }
    }
  }
};
