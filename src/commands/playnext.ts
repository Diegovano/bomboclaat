'use strict';

import { getQueue } from '../audio';
import { getTrackObjects } from './play';
import { logError } from '../log';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

export const module: bomboModule = {
  name: 'playnext',
  description: 'Add a track to the queue that will play after the current one.',
  slashCommand: new SlashCommandBuilder().addStringOption(option => option.setName('track').setDescription('Add a youtube link, playlist (youtube/spotify) or search term to the queue').setRequired(true)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction: VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.voiceChannel = interaction.member.voice.channel;
    const track = interaction.options.getString('track', true);
    getTrackObjects(interaction, track).then(async tracks => {
      if (tracks.length === 1) {
        currentQueue.add(tracks[0], false, true).then(msg => {
          if (msg) interaction.replied ? interaction.editReply({ content: msg, embeds: [], components: [] }) : interaction.reply(msg);
        }, err => {
          err.message = `WARNING: Cannot add track to queue! ${err.message}`;
          logError(err);
          interaction.reply('Cannot add track to queue!');
        });
      } else {
        interaction.reply(`Adding ${tracks.length} tracks to the queue!`);

        for (let i = 0; i < tracks.length; i++) {
          await currentQueue.add(tracks[i], true, true).then(msg => {
            if (msg) interaction.replied ? interaction.editReply({ content: msg, embeds: [], components: [] }) : interaction.reply(msg);
          }, err => {
            interaction.replied ? interaction.editReply({ content: err.message, embeds: [], components: [] }) : interaction.reply(err.message);
          });
        }
      }
    }, err => {
      err.message = `WARNING: Unable to get track information! ${err.message}`;
      logError(err);
    });
  }
};
