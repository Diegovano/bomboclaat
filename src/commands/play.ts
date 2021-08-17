'use strict';

import * as Discord from 'discord.js';
import { readFileSync } from 'fs';
import { google, youtube_v3 as youtubev3 } from 'googleapis';
import { getQueue, Track } from '../audio';
import { logError } from '../log';
import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';

const youtube = google.youtube('v3');

export const module: bomboModule = {
  name: 'play',
  description: 'If paused, unpause, otherwise add track to queue.',
  slashCommand: new SlashCommandBuilder().addStringOption(option => option.setName('track').setDescription('Add a youtube link, playlist (youtube/spotify) or search term to the queue').setRequired(false)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  ignoreBotChannel: false,
  async execute (interaction: VoiceCInteraction) {
    const currentQueue = getQueue(interaction.guild);

    currentQueue.voiceChannel = interaction.member.voice.channel;
    const arg = interaction.options.getString('track');
    if (!arg) {
      const result = currentQueue.paused ? await currentQueue.unpause() : await currentQueue.pause();
      interaction.reply(result);
      return;
    }

    await getTrackObjects(interaction, arg).then(async function addTracksToQueue (tracks) {
      if (tracks.length === 1) {
        await currentQueue.add(tracks[0], false, false).then(msg => {
          if (msg) {
            interaction.replied ? interaction.editReply({ content: msg, embeds: [], components: [] }) : interaction.reply(msg);
          }
        }, err => {
          err.message = `WARNING: Cannot add track to queue! ${err.message}`;
          logError(err);
          const msg = 'Cannot add track to queue!';
          interaction.replied ? interaction.editReply({ content: msg, embeds: [], components: [] }) : interaction.reply(msg);
        });
      } else if (tracks.length > 1) {
        const msg = `Adding ${tracks.length} tracks to the queue!`;
        interaction.replied ? interaction.editReply({ content: msg, embeds: [], components: [] }) : interaction.reply(msg);

        for (let i = 0; i < tracks.length; i++) {
          await currentQueue.add(tracks[i], true, false).then(msg => {
            if (msg) interaction.followUp(msg);
          }, err => {
            err.message = `WARNING: Cannot add track to playlist! ${err.message}`;
            logError(err);
            interaction.followUp('Cannot add track to playlist!');
          });
        }
      } else {
        const msg = 'No tracks added!';
        interaction.replied ? interaction.editReply({ content: msg, embeds: [], components: [] }) : interaction.reply(msg);
        // if no tracks returned i.e. no search results
      }
    }, async err => {
      err.message = `WARNING: Unable to get track information! ${err.message}`;
      logError(err);
      const msg = 'Unable to add track to queue!';
      interaction.replied ? await interaction.editReply({ content: msg, embeds: [], components: [] }).catch(_ => ({})) : await interaction.reply(msg).catch(_ => ({}));
      // Catching as the message may already be deleted.
    });
  }

};

export async function getTrackObjects (interaction: VoiceCInteraction, searchTerm: string): Promise<Track[]> {
  return new Promise<Track[]>((resolve, reject) => {
    const tracksToAdd: Track[] = [];

    const videoIdMatch = searchTerm.match(/(?:youtu)(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i);
    const timestampMatch = searchTerm.match(/(?:[?&]t=)(.*?)(?:&|$)/i);
    const playlistIdMatch = searchTerm.match(/(?<=[&?]list=)(.*?)(?=(&|$))/i);

    if (videoIdMatch) {
      return interaction.deferReply().then(_ => {
        const videoId = videoIdMatch[1];

        let timestamp: number | null;
        if (searchTerm[0].match(/[?&]t=/i)) {
          if (timestampMatch) {
            const timestampMatchString = timestampMatch[1];

            let seconds = 0;
            if (timestampMatchString.includes('h')) {
              let i = 0;
              while (timestampMatchString[i] !== 'h') i++;

              for (let i2 = 0; i2 < i; i2++) {
                seconds += parseInt(timestampMatchString[i - i2 - 1]) * 10 ** (i2) * 3600;
              }

              try {
                timestampMatchString[0].substr(i);
              } catch (error) {
                reject(error);
              }
            }

            if (timestampMatchString.includes('m')) {
              let i = 0;
              while (timestampMatchString[i] !== 'h') i++;

              for (let i2 = 0; i2 < i; i2++) {
                seconds += parseInt(timestampMatchString[i - i2 - 1]) * 10 ** (i2) * 60;
              }

              try {
                timestampMatchString[0].substr(i);
              } catch (error) {
                reject(error);
              }
            }

            if (timestampMatchString.includes('s')) {
              let i = 0;
              while (timestampMatchString[i] !== 's') i++;

              for (let i2 = 0; i2 < i; i2++) {
                seconds += parseInt(timestampMatchString[i - i2 - 1]) * 10 ** (i2);
              }
            }

            if (!timestampMatchString.includes('h') && !timestampMatchString.includes('m') && !timestampMatchString.includes('s')) {
              for (let i = 0; i < timestampMatchString.length; i++) {
                seconds += parseInt(timestampMatchString[timestampMatchString.length - i - 1]) * 10 ** (i);
              }
            }

            timestamp = timestampMatchString ? seconds : 0;
          }
        }

        let ytkey;

        if (!process.env.YTTOKEN) { // Check if running github actions or just locally
          try {
            ytkey = readFileSync('.yttoken', 'utf8');
          } catch (err) {
            return reject(Error('Cannot read YouTube key!'));
          }
        } else {
          ytkey = process.env.YTTOKEN;
        }

        const opts: youtubev3.Params$Resource$Videos$List =
          {
            part: ['snippet', 'contentDetails'], // IMPORTANT: CONTENT DETAILS PART REQUIRED!
            id: [videoId],
            key: ytkey
          };

        return youtube.videos.list(opts).then(res => {
          if (!res.data.items) return reject(Error('Unable to read video information!'));
          if (!interaction.member) return reject(Error('Seems like we are not in a guild...'));
          const track = new Track(res.data.items[0].id ?? 'invalid', res.data.items[0].snippet?.channelTitle ?? 'invalid',
            res.data.items[0].snippet?.localized?.title ?? 'invalid', res.data.items[0].snippet?.localized?.description ?? 'invalid',
            res.data.items[0].snippet?.thumbnails?.high?.url ?? 'invalid', interaction.member,
            timestamp ?? 0, parseInt(res.data.items[0].contentDetails?.duration ?? '0'));
          tracksToAdd.push(track);
          return resolve(tracksToAdd);
        }, err => {
          err.message = `Unable to get video information from link! ${err.message}`;
          return reject(err);
        });
      }).catch(err => {
        reject(err);
      });
    } else if (playlistIdMatch) {
      const playlistId = playlistIdMatch[1];

      let ytkey;
      if (!process.env.YTTOKEN) { // Check if running github actions or just locally
        try {
          ytkey = readFileSync('.yttoken', 'utf8');
        } catch (err) {
          return reject(Error('Cannot read YouTube key!'));
        }
      } else {
        ytkey = process.env.YTTOKEN;
      }

      const nextPage = '';

      const MAX_TRACKS_PER_PLAYLIST = 100; // multiples of 50

      const opts: youtubev3.Params$Resource$Playlistitems$List =
        {
          part: ['snippet', 'status'],
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPage,
          key: ytkey
        };

      youtube.playlistItems.list(opts).then(async function getPlaylistPageInfo (res) {
        if (!res.data.pageInfo?.resultsPerPage || !res.data.pageInfo.totalResults || !res.data.items) return reject(Error('Unable to get playlist information from link!'));
        for (let i = 0; i < MAX_TRACKS_PER_PLAYLIST / res.data.pageInfo.resultsPerPage && i < Math.ceil(res.data.pageInfo.totalResults / res.data.pageInfo.resultsPerPage); i++) {
          await youtube.playlistItems.list(opts).then(async function getPlaylistTracks (res) {
            if (!res.data.pageInfo?.resultsPerPage || !res.data.pageInfo.totalResults || !res.data.items || !interaction.member) return reject(Error('Unable to get playlist information from link!'));
            for (let i2 = 0; i2 < res.data.items.length; i2++) {
              if (res.data.items[i2].status?.privacyStatus === 'public' ||
                res.data.items[i2].status?.privacyStatus === 'unlisted') {
                const track = new Track(res.data.items[i2].snippet?.resourceId?.videoId ?? 'invalid', res.data.items[i2].snippet?.channelTitle ?? 'invalid',
                  res.data.items[i2].snippet?.title ?? 'invalid', res.data.items[i2].snippet?.description ?? 'invalid',
                  res.data.items[i2].snippet?.thumbnails?.high?.url ?? '', interaction.member, 0);

                tracksToAdd.push(track);
              }
            }
            if (res.data.nextPageToken) opts.pageToken = res.data.nextPageToken;
          }, err => {
            reject(err);
          });
        }
        resolve(tracksToAdd);
      }, err => {
        err.message = `Unable to get playlist information from link! ${err.message}`;
        reject(err);
      });
      // eslint-disable-next-line brace-style
    } /* else if (searchTerm[0].includes('spotify.com')) {
      getSpotifyMetadata(message, searchTerm).then(trackArray => { // is in array form
        resolve(trackArray);
      }, err => {
        reject(err);
      });
    } */ else {
      ytSearch(searchTerm, interaction).then(track => {
        tracksToAdd.push(track);
        resolve(tracksToAdd);
      }).catch(err => {
        reject(err);
      });
    }
  });
}

async function ytSearch (searchTerm: string, interaction: VoiceCInteraction) {
  return new Promise<Track>((resolve, reject) => {
    let ytkey;
    if (!process.env.YTTOKEN) { // Check if running github actions or just locally
      try {
        ytkey = readFileSync('.yttoken', 'utf8');
      } catch (err) {
        return reject(Error('SEVERE: Cannot read YouTube key!'));
      }
    } else {
      ytkey = process.env.YTTOKEN;
    }

    const opts: youtubev3.Params$Resource$Search$List =
      {
        q: searchTerm,
        part: ['snippet'],
        maxResults: 5,
        type: ['video'],
        key: ytkey
      };

    youtube.search.list(opts).then(async res => {
      if (!res.data.items || !interaction.member) return;
      const resArr = [];

      for (let i = 0; i < res.data.items.length; i++) {
        resArr.push(new Track(res.data.items[i].id?.videoId ?? 'invalid',
          res.data.items[i].snippet?.channelTitle ?? 'invalid',
          res.data.items[i].snippet?.title ?? 'invalid',
          res.data.items[i].snippet?.description ?? 'invalid',
          res.data.items[i].snippet?.thumbnails?.high?.url ?? 'invalid',
          interaction.member, 0));
      }
      resolve(userSelect(resArr, interaction));
    }, reason => {
      logError(Error(`Unable to search using googleApis! ${reason}`));
    });
  });
}

async function userSelect (results: Track[], interaction: VoiceCInteraction) {
  return new Promise<Track>((resolve, reject) => {
    if (results.length === 0) {
      interaction.reply('No results for your search!');
      return reject(Error('No results for your search!'));
    }

    const reactionList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const idIntSrt = ['one', 'two', 'three', 'four', 'five'];
    const idStrInt = new Map([
      ['one', 1],
      ['two', 2],
      ['three', 3],
      ['four', 4],
      ['five', 5]
    ]);

    if (results.length > reactionList.length) {
      logError(Error('WARNING: More results than reactions!'));
      results.length = reactionList.length;
    }

    const trackSelection = new Discord.MessageEmbed()
      .setTitle('Please make a selection: ')
      .setColor('#ff0000');

    for (let i = 0; i < results.length; i++) {
      trackSelection.addField(`${i + 1} - ${results[i].title},
            Channel: ${results[i].author}`, `https://www.youtube.com/watch?v=${results[i].videoId}`);
    }
    const buttons: Discord.MessageButton[] = [];
    for (let i = 0; i < results.length && i < 5; i++) {
      buttons.push(new Discord.MessageButton()
        .setCustomId(idIntSrt[i])
        .setStyle('PRIMARY')
        .setEmoji(reactionList[i]));
    }

    const filter: Discord.CollectorFilter<[Discord.MessageComponentInteraction]> = async i => {
      if (i.user.id === interaction.user.id) {
        i.deferUpdate();
      } else {
        i.reply({ content: 'These buttons aren\'t for you!', ephemeral: true });
      }
      return i.user.id === interaction.user.id;
    };

    const actionRow = new Discord.MessageActionRow().addComponents(buttons);
    interaction.reply({
      embeds: [trackSelection],
      components: [actionRow]
    }).then(async _ => await interaction.fetchReply()).then(async message => {
      if (message instanceof Discord.Message) {
        await message.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 15000 })
          .then(interaction => {
            const result = idStrInt.get(interaction.customId);
            if (result) {
              return resolve(results[result - 1]);
            }
          })
          .catch(_ => {
            message.delete();
            reject(Error('No answers received.'));
          });
      }
    }).catch(err => {
      reject(err);
    });
  });
}
