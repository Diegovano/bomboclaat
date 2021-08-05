'use strict';

import { getQueue, Track } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'shuffle',
  description: 'figure it out yourself it\'s not rocket science',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    function shuffle (array: Track[]) {
      let currentIndex = array.length; let temporaryValue; let randomIndex;

      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    const maybe = shuffle(currentQueue.trackList.slice(currentQueue.queuePos));

    for (let i = 0; i < maybe.length + 1; i++) {
      currentQueue.trackList[currentQueue.trackList.length - i] = maybe[maybe.length - i];
    }
  }
};
