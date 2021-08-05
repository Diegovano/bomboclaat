'use strict';

import { getQueue } from '../audio';
import { getTrackObjects } from './play';
import { logError } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'playnext',
  aliases: ['pn', 'next'],
  description: 'Add a track to the queue that will play after the current one.',
  args: 1,
  usage: '<track name>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.voiceChannel = message.member?.voice.channel ?? null;

    getTrackObjects(message, args).then(async tracks => {
      if (tracks.length === 1) {
        currentQueue.add(tracks[0], false, true).then(msg => {
          if (msg) message.channel.send(msg);
        }, err => {
          err.message = `WARNING: Cannot add track to queue! ${err.message}`;
          logError(err);
          message.channel.send('Cannot add track to queue!');
        });
      } else {
        message.channel.send(`Adding ${tracks.length} tracks to the queue!`);

        for (let i = 0; i < tracks.length; i++) {
          await currentQueue.add(tracks[i], true, true).then(msg => {
            if (msg) message.channel.send(msg);
          }, err => {
            message.channel.send(err.message);
          });
        }
      }
    }, err => {
      err.message = `WARNING: Unable to get track information! ${err.message}`;
      logError(err);
    });
  }
};
