'use strict';

import { version } from '../../package.json';
import { log } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'version',
  aliases: ['ver'],
  description: 'Display bomoclaat\'s version.',
  args: null,
  usage: null,
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    log(`Bomboclaat version ${version}`);
    message.channel.send(`Bomboclaat version ${version}`);
  }
};
