const conf = require('../configFiles.js');

module.exports = {
  name: 'autoaccent',
  description: 'Toggle auto-accent mode',
  aliases: ['aa'],
  voiceConnection: true,
  execute (message, _args) {
    const objectHandle = conf.config.configObject[message.guild.id];

    objectHandle.autoAccent = !objectHandle.autoAccent;
    conf.config.configChanged = true;
    message.channel.send(`${objectHandle.autoAccent ? 'Enabled' : 'Disabled'} auto-accent!`);
  }
};
