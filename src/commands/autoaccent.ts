'use strict';

import { config } from '../configFiles';
import { logError } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'autoaccent',
  aliases: ['aa'],
  description: 'Toggle auto-accent mode',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  async execute (message, _args) {
    if (!message.guild) return;
    const objectHandle = await config.get(message.guild);

    if (!objectHandle) throw Error('bomboModule autoAccent: guild config not initialised!');

    objectHandle.autoAccent = !objectHandle.autoAccent;
    config.writeToJSON().then(() => {
      message.channel.send(`${objectHandle.autoAccent ? 'Enabled' : 'Disabled'} auto-accent!`);
    }, err => {
      objectHandle.autoAccent = !objectHandle.autoAccent; // reset to previous
      err.message = `WARNING: Unable to update config file! ${err.message}`;
      logError(err);
    });
  }
};
