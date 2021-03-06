'use strict';

const Discord = require('discord.js');
const conf = require('../configFiles.js');
// const prefix = '|'; // static prefix for now

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'List all commands or more info about a specific command.',
  usage: '[command name]',
  dmCompatible: true,
  async execute (message, args) {
    const { commands } = message.client;
    const prefix = conf.config.configObject[message.guild.id].prefix;

    if (!args.length) { // Show help for all commands
      const helpEmbed = new Discord.MessageEmbed()
        .setTitle('Here\'s a list of all commands:')
        .addField(commands.map(command => command.name).join('\n'), `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);

      return message.channel.send(helpEmbed); // split true means that should the message be too long, it will be cut into multiple messages.
    }

    const name = args[0].toLowerCase(0);
    const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));

    if (!command) {
      return message.reply('That\'s not a valid command!');
    }

    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`NAME:\n${command.name}`)
      .setColor('0xF1C40F')
      .setThumbnail(message.client.user.displayAvatarURL());

    if (command.aliases && command.description && command.usage) helpEmbed.addField('ALIASES:', `${command.aliases.join(', ')}`);
    if (command.description) helpEmbed.addField('DESCRIPTION:', `${command.description}`);
    if (command.usage) helpEmbed.addField('USAGE:', `\`${prefix}${command.name} ${command.usage}\``);

    message.channel.send(helpEmbed);
  }
};
