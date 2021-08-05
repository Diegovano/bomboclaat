'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'unpause',
  aliases: ['go'],
  description: 'Unpause the player',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    try {
      currentQueue.unpause();
    } catch (error) {
      message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
    }
  }
};
