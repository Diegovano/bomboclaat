'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';
import { logError } from '../log';

export const module: bomboModule = {
  name: 'move',
  description: 'Moves a track to a certain position in the queue',
  args: 2,
  usage: '<track position> <new position>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    const from = parseInt(args[0]);
    const to = parseInt(args[1]);

    if (isNaN(from) || isNaN(to)) message.channel.send('Cannot move track! Arguments must be numbers.');

    currentQueue.move(from - 1, to - 1).then(msg => {
      if (msg) message.channel.send(msg);
    }, err => {
      err.message = `WARNING: Cannot move tracks! ${err.message}`;
      logError(err);
      message.channel.send('Cannot move track!');
    });
  }
};
