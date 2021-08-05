'use strict';

import { config } from '../configFiles';
import { logError } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'setaccent',
  description: 'Assign yourself an in-chat accent',
  args: 1,
  usage: '<language>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  async execute (message, args) {
    config.accentUser(message, args[0]).catch((err) => {
      err.message = `WARNING: Could not update user accent! ${err.message}`;
      logError(err);
    });
  }
};
