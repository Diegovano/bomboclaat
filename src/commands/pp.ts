'use strict';

import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'pp',
  aliases: ['dick', 'penis', 'hector'],
  description: 'Reveals the true size of people\'s ╭∩╮',
  args: null,
  usage: null,
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    if (message.author.username === 'Terminator00702' || message.author.username === 'Bobnotarobot') {
      message.channel.send(`${message.author.username}'s cock size is:\n8¬ 1 inch! WOW`);
      return;
    }

    const penis = ['8'];
    let iter = 0;
    for (; iter < Math.floor(Math.random() * 50); iter++) penis.push('=');

    message.channel.send(`${message.author.username}'s cock size is:\n${penis.toString().replace(/,/gi, '')}D    ${iter} inches!`);
  }
};
