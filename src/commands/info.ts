'use strict';

import * as Discord from 'discord.js';
import { bomboModule } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'personinfo',
  description: 'Gives critical information about the person.',
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: false,
  slashCommand: new SlashCommandBuilder().addUserOption(option => option.setName('person').setDescription('The person you would like to see info about.').setRequired(false)),
  async execute (interaction) {
    let sexuality = 'Straight';
    const user = interaction.options.getUser('person') ?? interaction.user;
    switch (user.username) {
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
      .addField('Playername', user.username)
      .addField('Sexuality', sexuality)
      .setColor(0xF1C40F)
      .setThumbnail(user.displayAvatarURL());

    if (interaction.guild) embed.addField('Your favourite server is:', interaction.guild.name);

    interaction.reply({ embeds: [embed] });
  }
};
