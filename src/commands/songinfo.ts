'use strict';

import { getQueue } from '../audio';
import { log, logError } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'trackinfo',
  description: 'Show info about a track in the queue',
  aliases: ['info', 'songinfo'],
  args: null, // 0 or 1
  usage: '[track number]',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.infoEmbed(args[0] ? (!isNaN(parseInt(args[0])) ? parseInt(args[0]) - 1 : currentQueue.queuePos) : currentQueue.queuePos).then(embed => {
      if (!embed) return;
      message.channel.send({ embeds: [embed.setAuthor('Bomborastaclaat', message.client?.user?.displayAvatarURL() ?? '')] })
        .catch(error => {
          error.message = `WARNING: Could not send information embed! ${error.message}`;
          logError(error);
        });
    }, err => {
      log(`Could not find track info! ${err.message}`);
      message.reply('error finding track information! Is value in range?');
    });
  }
};
