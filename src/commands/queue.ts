'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';
import { logError } from '../log';

export const module: bomboModule = {
  name: 'queue',
  aliases: ['q', 'list', 'next', 'playlist'],
  description: 'Print a list of the track added to the queue since the bot joined the voice channel.',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: false,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    getQueue(message.guild).getQueueMessage().then(messageContent => {
      if (typeof messageContent === 'string') {
        message.channel.send(messageContent);
      } else {
        message.channel.send({ embeds: messageContent }).catch(err => {
          message.channel.send('Unable to send queue message');
          err.message = `WARNING: Cannot send queue embeds! ${err.message}`;
          logError(err);
        });
      }
    }, err => {
      message.channel.send('Unable to get queue message');
      err.message = `WARNING: Cannot get queue message! ${err.message}`;
      logError(err);
    });
  }
};
