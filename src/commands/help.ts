'use strict';

import * as Discord from 'discord.js';
import { client } from '../index'
import { config } from '../configFiles';
import { bomboModule } from '../types';
import { DEFAULT_PREFIX } from '../index';

export const module: bomboModule = {
  name: 'help',
  aliases: ['h', 'commands', ''],
  description: 'List all commands or more info about a specific command.',
  args: null, // can be 0 or 1
  usage: '[command name]',
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, args) {
    const commands: Discord.Collection<string, bomboModule> = client.commands;
    let prefix: string;
    if (message.guild) prefix = (await config.get(message.guild))?.prefix ?? DEFAULT_PREFIX;
    prefix ??= DEFAULT_PREFIX;

    if (!args.length) { // Show help for all commands
      const helpEmbed = new Discord.EmbedBuilder()
        .setTitle('Here\'s a list of all commands:')
        .addFields({name: commands.map((cmd: bomboModule) => cmd.name).join('\n'), value: `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!` });

      message.channel.send({ embeds: [helpEmbed] }); // split true means that should the message be too long, it will be cut into multiple messages.
    } else {
      const name = args[0].toLowerCase();
      const command = commands.get(name) || commands.find((cmd: bomboModule) => (cmd.aliases && cmd.aliases.includes(name)) ?? false);

      if (!command) {
        message.reply('That\'s not a valid command!');
        return;
      }

      const helpEmbed = new Discord.EmbedBuilder()
        .setTitle(`NAME:\n${command.name}`)
        .setColor(0xF1C40F)
        .setThumbnail(message.client.user?.displayAvatarURL() ?? '');

      if (command.aliases) helpEmbed.addFields({ name: 'ALIASES:', value: `${command.aliases.join(', ')}` });
      if (command.description) helpEmbed.addFields({ name: 'DESCRIPTION:', value: `${command.description}` });
      if (command.usage) helpEmbed.addFields({ name: 'USAGE:', value: `\`${prefix}${command.name} ${command.usage}\`` });

      message.channel.send({ embeds: [helpEmbed] });
    }
  }
};
