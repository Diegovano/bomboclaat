'use strict';

const am = require('../audio.js');

module.exports = {
  name: 'seek',
  description: 'Seeks innit',
  args: true,
  guildOnly: true,
  voiceConnection: true,
  async execute (message, args) {
    const currentQueue = am.getQueue(message);

    // if (args[0].includes(`+`) || args[0].includes(`f`)) return currentQueue.seek(args[0].replace(/[+f]/g, ``), true);
    // if (args[0].includes(`-`) || args[0].includes(`b`)) return currentQueue.seek(-args[0].replace(/[-b]/g, ``), true);
    currentQueue.seek(args[0], false);
  }
};
