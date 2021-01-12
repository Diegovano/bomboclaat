const am = require('../audio.js');

module.exports = {
  name: 'reset',
  description: 'Reset the bot\'s audio systems in this guild!',
  execute (message, _args) {
    const currentQueue = am.getQueue(message);

    currentQueue.clean();
  }
};
