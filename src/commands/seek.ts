'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'seek',
  description: 'Seeks innit',
  args: 1,
  usage: '<seek value>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    // if (args[0].includes(`+`) || args[0].includes(`f`)) return currentQueue.seek(args[0].replace(/[+f]/g, ``), true);
    // if (args[0].includes(`-`) || args[0].includes(`b`)) return currentQueue.seek(-args[0].replace(/[-b]/g, ``), true);
    const seekVal = parseInt(args[0]);
    if (isNaN(seekVal)) message.channel.send('Input must be a number!');
    currentQueue.seek(seekVal);
  }
};
