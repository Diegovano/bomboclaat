'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'reset',
  description: 'Reset the bot\'s audio systems in this guild!',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: false,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.clean();
  }
};
