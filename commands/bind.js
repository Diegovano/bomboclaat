const am = require('../audio.js');

module.exports = {
  name: 'bind',
  description: 'Bind the bot to this text channel.',
  execute (message, _args) {
    const currentQueue = am.getQueue(message);

    if (message.channel.permissionsFor(message.client.user).has('SEND_MESSAGES')) currentQueue.textChannel = message.channel;
    else message.author.send(`Could not bind bot to ${message.channel.name} in server ${message.guild.name}! Insufficient permissions!`);
  }
};
