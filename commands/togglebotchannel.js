'use strict';

const conf = require('../configFiles.js');

module.exports = {
  name: 'togglebotchannel',
  description: 'Mark this channel as a bot channel, or vice-versa',
  args: false,
  execute (message, _args) {
    const objectHandle = conf.config.configObject[message.guild.id];

    if (!objectHandle) throw Error('Guild not initialised!');

    // if (objectHandle.botChannels.findIndex(element => element.id === message.channel.id) === -1)
    if (!objectHandle.botChannels[message.channel.id]) {
      objectHandle.botChannels[message.channel.id] = {
        name: message.channel.name,
        topic: message.channel.topic
      };
      conf.config.configChanged = true;
      message.channel.send(`${message.channel.name} added to bot channels!`);
    } else {
      delete objectHandle.botChannels[message.channel.id];
      conf.config.configChanged = true;
      message.channel.send(`${message.channel.name} was removed as a bot channel!`);
    }
  }
};
