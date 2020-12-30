const conf = require('../configFiles.js');
const l = require('../log.js');

module.exports = {
  name: 'autoaccent',
  description: 'Toggle auto-accent mode',
  aliases: ['aa'],
  voiceConnection: true,
  execute (message, _args) {
    const objectHandle = conf.config.configObject[message.guild.id];

    objectHandle.autoAccent = !objectHandle.autoAccent;
    conf.config.writeToJSON().then(() => {
      message.channel.send(`${objectHandle.autoAccent ? 'Enabled' : 'Disabled'} auto-accent!`);
    }, err => {
      objectHandle.autoAccent = !objectHandle.autoAccent; // reset to previous
      err.message = `WARNING: Unable to update config file! ${err.message}`;
      l.logError(err);
    });
  }
};
