'use strict';

const conf = require('../configFiles.js');

module.exports = {
  name: 'prefix',
  description: 'Change the bot\'s prefix for this server',
  args: true,
  usage: '<new prefix>',
  execute (message, args) {
    const objectHandle = conf.config.configObject[message.guild.id];

    if (!objectHandle) throw Error('Guild config not initialised!');

    objectHandle.prefix = args[0];
    conf.config.configChanged = true;
    message.channel.send(`Prefix changed to '${objectHandle.prefix}'`);
  }
};
