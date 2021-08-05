'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'loop',
  aliases: ['l', 'replay', 'again'],
  description: 'Toggle between no loop, track loop and queue loop',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    if (!currentQueue.loopTrack && !currentQueue.loopQueue) {
      currentQueue.toggleTrackLoop();
      message.channel.send('Now looping this track!');
    } else if (currentQueue.loopTrack) {
      currentQueue.toggleTrackLoop();
      currentQueue.toggleQueueLoop();
      message.channel.send('Now looping the queue!');
    } else {
      currentQueue.toggleQueueLoop();
      message.channel.send('Looping disabled!');
    }
  }
};
