'use strict';

import { bomboModule, CInteraction } from '../types';
import { log, logError } from '../log';
import { SlashCommandBuilder } from '@discordjs/builders';

// No easy way to change dynamically as client would not exist in this context so I am not going to try
// Choices must be a max of 25 or fewer so removed version
const choices: [name: string, value: string][] = [
  ['accent', 'accent'],
  ['autoaccent', 'autoaccent'],
  ['bg', 'bg'],
  ['bind', 'bind'],
  ['clear', 'clear'],
  ['personinfo', 'personinfo'],
  ['join', 'join'],
  ['leave', 'leave'],
  ['loop', 'loop'],
  ['move', 'move'],
  ['play', 'play'],
  ['playnext', 'playnext'],
  ['queue', 'queue'],
  ['reload', 'reload'],
  ['remove', 'remove'],
  ['reset', 'reset'],
  ['seek', 'seek'],
  ['setaccent', 'setaccent'],
  ['shuffle', 'shuffle'],
  ['skip', 'skip'],
  ['switch', 'switch'],
  ['togglebotchannel', 'togglebotchannel'],
  ['trackinfo', 'trackinfo'],
  ['volume', 'volume'],
  ['version', 'version']
];

export const module: bomboModule = {
  name: 'reload',
  description: 'Reloads a command.',
  slashCommand: new SlashCommandBuilder().addStringOption(option => option.setName('command').setDescription('Command to reload').setRequired(true).addChoices(choices)),
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: false,
  async execute (interaction:CInteraction) {
    const command = <bomboModule>interaction.client.commands.get(interaction.options.getString('command', true));
    delete require.cache[require.resolve(`./${command.name}.js`)];

    try {
      const newCommand = await import(`./${command.name}.js`);
      interaction.client.commands.set(newCommand.name, newCommand);
      interaction.reply(`Command "${command.name}" was successfully reloaded!`);
      log(`Reloaded "${command.name}" successfully!`);
    } catch (error) {
      error.message = `SEVERE: "${command.name}" could not be reloaded! ${command.name}: ${error.message}`;
      logError(error);
      interaction.reply('There was an error while reloading a command ');
    }
  }
};
