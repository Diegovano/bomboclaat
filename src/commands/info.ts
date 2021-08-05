'use strict';

import * as Discord from 'discord.js';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'personinfo',
  aliases: ['person', 'pinfo'],
  description: 'Gives critical information about the person.',
  args: null,
  usage: null,
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    let sexuality = 'Straight';
    switch (message.author.username) {
      case 'Powered By Salt':
        sexuality = 'curvy';
        break;

      case 'Terminator00702':
        sexuality = 'poof';
        break;

      case 'Gabriele':
        sexuality = 'oMnisexual';
        break;

      case 'Jacko':
        sexuality = 'Penguin';
        break;

      case 'Jesus du 89':
        sexuality = 'Dragon';
        break;

      case 'bowser from sonic':
        sexuality = 'gay bombocraasclaat';
        break;
    }

    const embed = new Discord.MessageEmbed()
      .setTitle('User Info')
      .addField('Playername', message.author.username)
      .addField('Sexuality', sexuality)
      .setColor(0xF1C40F)
      .setThumbnail(message.author.displayAvatarURL());

    if (message.guild) embed.addField('Your favourite server is:', message.guild.name);

    message.channel.send({ embeds: [embed] });
  }
};
