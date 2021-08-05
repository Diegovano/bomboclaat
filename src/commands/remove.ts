'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'remove',
  aliases: ['r'],
  description: 'Gets rid of a track in the queue',
  args: 1,
  usage: '<track position>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.remove(parseInt(args[0]) - 1).then(msg => {
      message.channel.send(msg);
    }, err => {
      message.channel.send(`Error removing track! ${err.message}`);
      // err.message = `WARNING: Error removing track ${err.message}`;
      // l.logError(err);
    });
  }
};
