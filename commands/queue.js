'use strict';

const am = require('../audio.js');
const l = require('../log.js');

module.exports = {
  name: 'queue',
  aliases: ['q', 'list', 'next', 'playlist'],
  description: 'Print a list of the track added to the queue since the bot joined the voice channel.',
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    am.getQueue(message).getQueueMessage().then(messageContent => {
      for (let i = 0; i < messageContent.length; i++) {
        message.channel.send(messageContent[i]).catch(err => {
          message.channel.send('Unable to send queue message');
          err.message = `WARNING: Cannot send queue embeds! ${err.message}`;
          l.logError(err);
        });
      }
    }, err => {
      message.channel.send('Unable to get queue message');
      err.message = `WARNING: Cannot get queue message! ${err.message}`;
      l.logError(err);
    });
  }
};
