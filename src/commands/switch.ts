'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'switch',
  description: 'The bot will join the voice channel of the requestor.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.voiceChannel = message.member?.voice.channel ?? null;
    if (currentQueue.currentTrack) currentQueue.play(currentQueue.timestamp);
  }
};
