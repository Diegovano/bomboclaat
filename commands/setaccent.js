const conf = require('../configFiles.js');
const l = require('../log.js');

module.exports = {
  name: 'setaccent',
  description: 'Assign yourself an in-chat accent',
  args: true,
  usage: '<language>',
  async execute (message, args) {
    const objectHandle = conf.config.configObject[message.guild.id];
    const errorMessage = 'WARNING: Could not update user accent! ';
    if (message.channel.type !== 'text') await l.logError(Error(`${errorMessage} Cannot accent non-guild user!`));
    if (this.configObject === null) await l.logError(Error(`${errorMessage} Config Object is invalid!`));
    if (objectHandle === undefined) await l.logError(Error(`${errorMessage} Guild is not initialised!`));

    objectHandle.accents[message.author.id].accent = args[0];
    this.configChanged = true;
    message.reply(`, changed accent to ${args[0]}!`);
  }
};
