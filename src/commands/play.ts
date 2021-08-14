'use strict';

import * as Discord from 'discord.js';
import { readFileSync } from 'fs';
import { google, youtube_v3 as youtubev3 } from 'googleapis';
import { getQueue, Track } from '../audio';
import { logError } from '../log';
import { bomboModule, wait } from '../types';

const youtube = google.youtube('v3');

export const module: bomboModule = {
  name: 'play',
  aliases: ['p'],
  description: 'If paused, unpause, otherwise add track to queue.',
  args: null, // can be 0 or 1
  usage: '[track name]',
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.voiceChannel = message.member?.voice.channel ?? null;

    if (!args[0]) {
      try {
        currentQueue.unpause();
      } catch (error) {
        message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
      }
      return;
    }

    getTrackObjects(message, args).then(async function addTracksToQueue (tracks) {
      if (tracks.length === 1) {
        currentQueue.add(tracks[0], false, false).then(msg => {
          if (msg) message.channel.send(msg);
        }, err => {
          err.message = `WARNING: Cannot add track to queue! ${err.message}`;
          logError(err);
          message.channel.send('Cannot add track to queue!');
        });
      } else if (tracks.length > 1) {
        message.channel.send(`Adding ${tracks.length} tracks to the queue!`);

        for (let i = 0; i < tracks.length; i++) {
          await currentQueue.add(tracks[i], true, false).then(msg => {
            if (msg) message.channel.send(msg);
          }, err => {
            err.message = `WARNING: Cannot add track to playlist! ${err.message}`;
            logError(err);
            message.channel.send('Cannot add track to playlist!');
          });
        }
      } else {
        message.channel.send('No tracks added!'); // if no tracks returned i.e. no search results
      }
    }, err => {
      err.message = `WARNING: Unable to get track information! ${err.message}`;
      logError(err);
      message.channel.send('Unable to add track to queue!');
    });
  }

};

export async function getTrackObjects (message: Discord.Message, searchTerm: string[]): Promise<Track[]> {
  return new Promise<Track[]>((resolve, reject) => {
    const tracksToAdd: Track[] = [];

    const videoIdMatch = searchTerm[0].match(/(?:youtu)(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i);
    const timestampMatch = searchTerm[0].match(/(?:[?&]t=)(.*?)(?:&|$)/i);
    const playlistIdMatch = searchTerm[0].match(/(?<=[&?]list=)(.*?)(?=(&|$))/i);

    if (videoIdMatch) {
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
        if (!message.member) return reject(Error('Seems like we are not in a guild...'));
        const track = new Track(res.data.items[0].id ?? 'invalid', res.data.items[0].snippet?.channelTitle ?? 'invalid',
          res.data.items[0].snippet?.localized?.title ?? 'invalid', res.data.items[0].snippet?.localized?.description ?? 'invalid',
          res.data.items[0].snippet?.thumbnails?.high?.url ?? 'invalid', message.member,
          timestamp ?? 0, parseInt(res.data.items[0].contentDetails?.duration ?? '0'));
        tracksToAdd.push(track);
        resolve(tracksToAdd);
      }, err => {
        err.message = `Unable to get video information from link! ${err.message}`;
        return reject(err);
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
            if (!res.data.pageInfo?.resultsPerPage || !res.data.pageInfo.totalResults || !res.data.items || !message.member) return reject(Error('Unable to get playlist information from link!'));
            for (let i2 = 0; i2 < res.data.items.length; i2++) {
              if (res.data.items[i2].status?.privacyStatus === 'public' ||
                                         res.data.items[i2].status?.privacyStatus === 'unlisted') {
                const track = new Track(res.data.items[i2].snippet?.resourceId?.videoId ?? 'invalid', res.data.items[i2].snippet?.channelTitle ?? 'invalid',
                  res.data.items[i2].snippet?.title ?? 'invalid', res.data.items[i2].snippet?.description ?? 'invalid',
                  res.data.items[i2].snippet?.thumbnails?.high?.url ?? '', message.member, 0);

                tracksToAdd.push(track);
              }
            }
            if (res.data.nextPageToken) opts.pageToken = res.data.nextPageToken;
          }, err => {
            reject(err);
          });
        }
        return resolve(tracksToAdd);
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
      ytSearch(searchTerm.join(' '), message).then(track => {
        if (!track) resolve([]);
        else {
          tracksToAdd.push(track);
          resolve(tracksToAdd);
        }
      }, err => {
        reject(err);
      });
    }
  });
}

async function ytSearch (searchTerm: string, message: Discord.Message) {
  return new Promise<Track | null>((resolve, reject) => {
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

    youtube.search.list(opts).then(res => {
      if (!res.data.items || !message.member) return;
      const resArr = [];

      for (let i = 0; i < res.data.items.length; i++) {
        resArr.push(new Track(res.data.items[i].id?.videoId ?? 'invalid',
          res.data.items[i].snippet?.channelTitle ?? 'invalid',
          res.data.items[i].snippet?.title ?? 'invalid',
          res.data.items[i].snippet?.description ?? 'invalid',
          res.data.items[i].snippet?.thumbnails?.high?.url ?? 'invalid',
          message.member, 0));
      }

      userSelect(resArr, message).then(res => {
        resolve(res);
      }, err => {
        reject(err);
      });
    }, reason => {
      logError(Error(`Unable to search using googleApis! ${reason}`));
    });
  });
}

async function userSelect (results: Track[], message: Discord.Message) {
  return new Promise<Track | null>((resolve, reject) => {
    if (results.length === 0) {
      message.channel.send('No results for your search!');
      return resolve(null);
    }

    const reactionList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

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

    message.channel.send({ embeds: [trackSelection] }).then(async function collectReaction (msg) {
      const reactionTime = 30 * 1000;
      const waitTime = 5 * 1000;
      const options: Discord.ReactionCollectorOptions = { max: 1, time: reactionTime };
      const reactionPromiseList: Promise<Discord.MessageReaction | void>[] = [];
      let embedDeleted = false;
      let collected = false;

      for (let i = 0; i < results.length && i < reactionList.length; i++) {
        if (!embedDeleted) {
          reactionPromiseList.push(msg.react(reactionList[i]).catch(reason => {
            logError(Error(`WARNING: Unable to add reaction to embed! Has message been deleted? ${reason}`));
            return Promise.resolve();
          }));
        }
        // most likely error is that embed has already been deleted before all reactions are added. No action necessary.
      }

      const filters: Discord.ReactionCollectorOptions[] = [];

      for (let i = 0; i < results.length && i < reactionList.length; i++) {
        filters.push({ ...options, filter: (reaction, user) => reaction.emoji.name === reactionList[i] && user.id === message.author.id });
      }

      const collectors = [];

      for (let i = 0; i < results.length && i < reactionList.length; i++) {
        collectors.push(msg.createReactionCollector(filters[i]));
        collectors[i].on('collect', () => {
          if (collected) return;
          collected = true;
          const timer = wait(waitTime);
          Promise.all([...reactionPromiseList, timer]).then(() => {
            if (embedDeleted) return;
            embedDeleted = true;
            msg.delete();
          }).catch(err => {
            err.message = `WARNING: Cannot delete search result embed! ${err.message}`;
            logError(err);
            if (!msg.deleted) msg.delete();
          });
          resolve(results[i]);
        });
      }

      setTimeout(() => {
        if (!embedDeleted) {
          embedDeleted = true;
          msg.delete();
        }
      }, reactionTime).unref();
    }, err => {
      reject(err);
    });
  });
}
