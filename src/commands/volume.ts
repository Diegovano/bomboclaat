'use strict';

import { getQueue } from '../audio';
import { logError } from '../log';
import { bomboModule } from '../types';

const DEFAULT_VOLUME = 0.15;

export const module: bomboModule = {
  name: 'volume',
  aliases: ['v', 'vol'],
  description: 'earrape',
  args: 1,
  usage: '<volume level>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    // if (Number(args[0]) !== parseFloat(args[0])) return message.channel.send('Please provide a number!');
    if (isNaN(parseFloat(args[0]))) {
      message.channel.send('Pleave provide a number!');
      return;
    }

    const currentQueue = getQueue(message.guild);

    try {
      await currentQueue.setVolume(parseFloat(args[0]) * DEFAULT_VOLUME);
      message.channel.send(`Changed the volume to ${args[0]}.`);
      return;
    } catch (err) {
      if (err instanceof Error) {
        err.message = `What u trying to change the volume of idiot? ${err.message}`;
        logError(err);
      } else logError(Error('WARNING: Logging non-error typed error!'));
    }
  }
};
