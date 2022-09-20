'use strict';

import { client } from '../index'
import { bomboModule } from '../types';
import { log, logError } from '../log';

export const module: bomboModule = {
  name: 'reload',
  description: 'Reloads a command.',
  args: 1,
  usage: '<command to reload>',
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, args) {
    const commandName = args[0].toLowerCase();
    const command = client.commands.get(commandName) ||
            client.commands.find(cmd => cmd.aliases?.includes(commandName) ?? false);

    if (!command) {
      message.channel.send(`There is no command with name or alias ${commandName}, ${message.author}!`);
      return;
    }

    delete require.cache[require.resolve(`./${command.name}.js`)];

    try {
      const newCommand = await import(`./${command.name}.js`);
      client.commands.set(newCommand.name, newCommand);
      message.channel.send(`Command "${command.name}" was successfully reloaded!`).catch(err => logError(err));
      log(`Reloaded "${command.name}" successfully!`);
    } catch (err) {
      if (err instanceof Error) {
        err.message = `SEVERE: "${commandName}" could not be reloaded! ${command.name}: ${err.message}`;
        logError(err);
      } else logError(Error('WARNING: Logging non-error typed error!'));
      message.channel.send('There was an error while reloading a command ');
    }
  }
};
