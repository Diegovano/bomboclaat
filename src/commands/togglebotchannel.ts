'use strict';

import { config } from '../configFiles';
import { logError } from '../log.js';
import { bomboModule, GuildCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'togglebotchannel',
  description: 'Mark this channel as a bot channel, or vice-versa',
  slashCommand: new SlashCommandBuilder(),
  dmCompatible: false,
  voiceConnection: false,
  textBound: false,
  ignoreBotChannel: true,
  async execute (interaction:GuildCInteraction) {
    const objectHandle = await config.get(interaction.guild);

    if (!objectHandle) throw Error('Guild not initialised!');

    // if (objectHandle.botChannels.findIndex(element => element.id === message.channel.id) === -1)
    if (!objectHandle.botChannels.get(interaction.channel.id)) {
      const botChannelObject =
            {
              name: interaction.channel.name,
              topic: interaction.channel.topic
            };

      objectHandle.botChannels.set(interaction.channel.id, botChannelObject);
      config.writeToJSON().then(() => {
        interaction.reply(`${interaction.channel.name} added to bot channels!`);
      }, err => {
        objectHandle.botChannels.delete(interaction.channel.id); // if unable to write reset
        err.message = `WARNING: Unable to update config file! ${err.message}`;
        logError(err);
      });
    } else {
      const backupObject = objectHandle.botChannels.get(interaction.channel.id);

      objectHandle.botChannels.delete(interaction.channel.id);
      config.writeToJSON().then(() => {
        interaction.reply(`${interaction.channel.name} was removed as a bot channel!`);
      }, err => {
        if (backupObject) objectHandle.botChannels.set(interaction.channel.id, backupObject); // if unable to write reset
        else objectHandle.botChannels.delete(interaction.channel.id);
        err.message = `WARNING: Unable to update config file! ${err.message}`;
        logError(err);
      });
    }
  }
};
