'use strict';

const conf = require('../configFiles.js');
const l = require('../log.js');

module.exports = {
  name: 'togglebotchannel',
  description: 'Mark this channel as a bot channel, or vice-versa',
  args: false,
  execute (message, _args) {
    const objectHandle = conf.config.configObject[message.guild.id];

    if (!objectHandle) throw Error('Guild not initialised!');

    // if (objectHandle.botChannels.findIndex(element => element.id === message.channel.id) === -1)
    if (!objectHandle.botChannels[message.channel.id]) {
      const botChannelObject =
            {
              name: message.channel.name,
              topic: message.channel.topic
            };

      objectHandle.botChannels[message.channel.id] = botChannelObject;
      conf.config.writeToJSON().then(() => {
        message.channel.send(`${message.channel.name} added to bot channels!`);
      }, err => {
        objectHandle.botChannels[message.channel.id] = undefined; // if unable to write reset
        err.message = `WARNING: Unable to update config file! ${err.message}`;
        l.logError(err);
      });
    } else {
      const backupObject = objectHandle.botChannels[message.channel.id];

      delete objectHandle.botChannels[message.channel.id];
      conf.config.writeToJSON().then(() => {
        message.channel.send(`${message.channel.name} was removed as a bot channel!`);
      }, err => {
        objectHandle.botChannels[message.channel.id] = backupObject; // if unable to write reset
        err.message = `WARNING: Unable to update config file! ${err.message}`;
        l.logError(err);
      });
    }
  }
};
