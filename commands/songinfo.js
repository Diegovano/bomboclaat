'use strict';

const am = require('../audio.js');
const l = require('../log.js');

module.exports = {
  name: 'trackinfo',
  description: 'Show info about a track in the queue',
  aliases: ['info', 'songinfo'],
  usage: '[track number]',
  args: true,
  voiceConnection: true,
  async execute (message, args) {
    const currentQueue = am.getQueue(message);

    currentQueue.infoEmbed(args[0] ? args[0] - 1 : currentQueue.queuePos).then(embed => {
      message.channel.send(embed.setAuthor('Bomborastaclaat', message.client.user.displayAvatarURL()))
        .catch(error => {
          error.message = `WARNING: Could not send information embed! ${error.message}`;
          l.logError(error);
        });
    }, err => {
      l.log(`Could not find track info! ${err.message}`);
      message.reply('error finding track information! Is value in range?');
    });
  }
};
