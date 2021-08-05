'use strict';

import { getQueue } from '../audio';
import { logError } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'skip',
  aliases: ['s', 'next'],
  description: 'Skip the current track.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.skip().then(msg => {
      if (msg) message.channel.send(msg);
    }, err => {
      message.channel.send('Unable to skip track!');
      err.message = `WARNING: Unable to skip track! ${err.message}`;
      logError(err);
    });
  }
};
