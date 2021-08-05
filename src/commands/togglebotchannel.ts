'use strict';

import { DMChannel, ThreadChannel } from 'discord.js';
import { config } from '../configFiles';
import { logError } from '../log.js';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'togglebotchannel',
  description: 'Mark this channel as a bot channel, or vice-versa',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    if (!message.guild || message.channel instanceof DMChannel || message.channel instanceof ThreadChannel) return;
    const objectHandle = await config.get(message.guild);

    if (!objectHandle) throw Error('Guild not initialised!');

    // if (objectHandle.botChannels.findIndex(element => element.id === message.channel.id) === -1)
    if (!objectHandle.botChannels.get(message.channel.id)) {
      const botChannelObject =
            {
              name: message.channel.name,
              topic: message.channel.topic
            };

      objectHandle.botChannels.set(message.channel.id, botChannelObject);
      config.writeToJSON().then(() => {
        if (!message.guild || message.channel instanceof DMChannel || message.channel instanceof ThreadChannel) return;
        message.channel.send(`${message.channel.name} added to bot channels!`);
      }, err => {
        objectHandle.botChannels.delete(message.channel.id); // if unable to write reset
        err.message = `WARNING: Unable to update config file! ${err.message}`;
        logError(err);
      });
    } else {
      const backupObject = objectHandle.botChannels.get(message.channel.id);

      objectHandle.botChannels.delete(message.channel.id);
      config.writeToJSON().then(() => {
        if (!message.guild || message.channel instanceof DMChannel || message.channel instanceof ThreadChannel) return;
        message.channel.send(`${message.channel.name} was removed as a bot channel!`);
      }, err => {
        if (backupObject) objectHandle.botChannels.set(message.channel.id, backupObject); // if unable to write reset
        else objectHandle.botChannels.delete(message.channel.id);
        err.message = `WARNING: Unable to update config file! ${err.message}`;
        logError(err);
      });
    }
  }
};
