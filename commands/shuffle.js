const am = require('../audio.js');

module.exports = {
  name: 'shuffle',
  description: 'figure it out yourself its not rocket science',
  voiceConnection: true,
  async execute (message, _args) {
    const currentQueue = am.getQueue(message);

    function shuffle (array) {
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
