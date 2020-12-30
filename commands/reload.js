'use strict';

const l = require('../log.js');

module.exports = {
  name: 'reload',
  description: 'Reloads a command.',
  args: true,
  usage: '<command to reload>',
  async execute (message, args) {
    const commandName = args[0].toLowerCase();
    const command = message.client.commands.get(commandName) ||
            message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return message.channel.send(`There is no command with name or alias ${commandName}, ${message.author}!`);

    delete require.cache[require.resolve(`./${command.name}.js`)];

    try {
      const newCommand = require(`./${command.name}.js`);
      message.client.commands.set(newCommand.name, newCommand);
      message.channel.send(`Command "${command.name}" was successfully reloaded!`);
      l.log(`Reloaded "${command.name}" successfully!`);
    } catch (error) {
      error.message = `SEVERE: "${commandName}" could not be reloaded! ${command.name}: ${error.message}`;
      l.logError(error);
      message.channel.send('There was an error while reloading a command ');
    }
  }
};
