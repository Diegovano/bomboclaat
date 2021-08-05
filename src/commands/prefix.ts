'use strict';

import { bomboModule } from '../types';
import { config } from '../configFiles';
import { logError } from '../log';

export const module: bomboModule = {
  name: 'prefix',
  description: 'Change the bot\'s prefix for this server',
  args: 1,
  usage: '<new prefix>',
  dmCompatible: false,
  voiceConnection: false,
  textBound: false,
  async execute (message, args) {
    if (!message.guild) return;

    const objectHandle = await config.get(message.guild);
    if (!objectHandle) throw Error('Guild config not initialised!');

    const prevPrefix = objectHandle.prefix;

    objectHandle.prefix = args[0];
    config.writeToJSON().then(() => {
      message.channel.send(`Prefix changed to '${objectHandle.prefix}'`);
    }, err => {
      objectHandle.prefix = prevPrefix; // if unable to write reset to old prefix
      err.message = `WARNING: Unable to update config file! ${err.message}`;
      logError(err);
    });
  }
};
