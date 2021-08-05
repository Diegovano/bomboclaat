'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'nowplaying',
  description: 'shows the banger currently playing',
  aliases: ['np', 'current', 'playing'],
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    message.client.commands.get('trackinfo')?.execute(message, [`${currentQueue.queuePos}`]);
  }
};
