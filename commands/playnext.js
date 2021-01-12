'use strict';

const am = require('../audio.js');
const play = require('./play.js');
const l = require('../log.js');

module.exports = {
  name: 'playnext',
  aliases: ['pn', 'next'],
  description: 'Add a track to the queue that will play after the current one.',
  args: true,
  usage: '<track name>',
  voiceConnection: true,
  async execute (message, args) {
    const currentQueue = am.getQueue(message);

    if (message.channel.id !== currentQueue.textChannel.id) { return message.channel.send(`Bot is bound to ${currentQueue.textChannel.name}, please use this channel to see the queue!`); }

    currentQueue.voiceChannel = message.member.voice.channel;

    play.getTrackObjects(message, args).then(async tracks => {
      if (tracks.length === 1) {
        currentQueue.add(tracks[0], false, true).then(msg => {
          if (msg) message.channel.send(msg);
        }, err => {
          err.message = `WARNING: Cannot add track to queue! ${err.message}`;
          l.logError(err);
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
      l.logError(err);
    });
  }
};
