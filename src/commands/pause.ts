'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'pause',
  aliases: ['stop'],
  description: 'Pause the current track.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    try {
      currentQueue.pause();
    } catch (error) {
      message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
    }
  }
};
