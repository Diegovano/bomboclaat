'use strict';

import { readFile } from 'fs';
import { log } from '../log';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'insult',
  description: 'Provide the user with a searing insult.',
  args: null,
  usage: null,
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    let insults: string[];
    readFile('../slurs.txt', 'utf8', (err, data) => {
      if (err) {
        log('"slurs.txt" could not be read or does not exist. Using default insults.');
        insults = ['you burnt piece of celery.', 'you cunt.', 'you SIMP.', 'you Smol BRaIn.', 'you idiot sandwich.', 'you GAB!'];
      } else {
        insults = data.split('\n');
      }
      message.channel.send(`Fuck you, ${message.author.username}, ${insults[Math.floor(Math.random() * insults.length)]}`);
    });
  }
};
