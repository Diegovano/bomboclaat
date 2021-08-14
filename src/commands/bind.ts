'use strict';

import { TextChannel } from 'discord.js';
import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'bind',
  description: 'Bind the bot to this text channel.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    if (!message.guild || !message.client.user) return;
    const currentQueue = getQueue(message.guild);

    message.guild.members.fetch(message.client.user.id).then(member => {
      if (!message.guild || !(message.channel instanceof TextChannel)) return;
      if (message.channel.permissionsFor(member).has('SEND_MESSAGES')) currentQueue.textChannel = message.channel;
      else message.author.send(`Could not bind bot to ${message.channel.name} in server ${message.guild.name}! Insufficient permissions!`);
    }, err => {
      throw err;
    });
  }
};
