'use strict';

const fs = require('fs');
const am = require('../audio.js');
const { google } = require('googleapis');
const Discord = require('discord.js');
const l = require('../log.js');
const youtube = google.youtube('v3');
const spotifyHandler = require('../spotifyHandler.js');

module.exports = {
  name: 'play',
  aliases: ['p'],
  description: 'If paused, unpause, otherwise add track to queue.',
  usage: '[track name]',
  guidOnly: true,
  textBound: true,
  voiceConnection: true,
  async execute (message, args) {
    const currentQueue = am.getQueue(message);

    currentQueue.voiceChannel = message.member.voice.channel;

    if (!args[0]) {
      try {
        currentQueue.unpause();
      } catch (error) {
        message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
      }
      return;
    }

    getTrackObjects(message, args).then(async tracks => {
      /* message.channel.send(`No tracks added!`); */ // if no tracks returned i.e. no search results
      if (tracks && tracks.length === 1) {
        currentQueue.add(tracks[0], false, false).then(msg => {
          if (msg) message.channel.send(msg);
        }, err => {
          err.message = `WARNING: Cannot add track to queue! ${err.message}`;
          l.logError(err);
          message.channel.send('Cannot add track to queue!');
        });
      } else if (tracks && tracks.length > 1) {
        message.channel.send(`Adding ${tracks.length} tracks to the queue!`);

        for (let i = 0; i < tracks.length; i++) {
          await currentQueue.add(tracks[i], true, false).then(msg => {
            if (msg) message.channel.send(msg);
          }, err => {
            err.message = `WARNING: Cannot add track to playlist! ${err.message}`;
            l.logError(err);
            message.channel.send('Cannot add track to playlist!');
          });
        }
      }
    }, err => {
      err.message = `WARNING: Unable to get track information! ${err.message}`;
      l.logError(err);
      message.channel.send('Unable to add track to queue!');
    });
  }

};

const getTrackObjects = async (message, searchTerm) => {
  return new Promise((resolve, reject) => {
    const tracksToAdd = [];

    if (searchTerm[0].match(/(?:youtu)(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i)) {
      const videoID = searchTerm[0].match(/(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i)[1];

      let timestamp;
      if (searchTerm[0].match(/[?&]t=/i)) {
        timestamp = searchTerm[0].match(/(?:[?&]t=)(.*?)(?:&|$)/i)[1];

        let seconds = 0;
        if (timestamp.includes('h')) {
          let i = 0;
          while (timestamp[i] !== 'h') i++;

          for (let i2 = 0; i2 < i; i2++) {
            seconds += timestamp[i - i2 - 1] * 10 ** (i2) * 3600;
          }

          try {
            timestamp[0].shift(i);
          } catch (error) {
            reject(error);
          }
        }

        if (timestamp.includes('m')) {
          let i = 0;
          while (timestamp[i] !== 'h') i++;

          for (let i2 = 0; i2 < i; i2++) {
            seconds += timestamp[i - i2 - 1] * 10 ** (i2) * 60;
          }

          try {
            timestamp[0].shift(i);
          } catch (error) {
            reject(error);
          }
        }

        if (timestamp.includes('s')) {
          let i = 0;
          while (timestamp[i] !== 's') i++;

          for (let i2 = 0; i2 < i; i2++) {
            seconds += timestamp[i - i2 - 1] * 10 ** (i2);
          }
        }

        if (!timestamp.includes('h') && !timestamp.includes('m') && !timestamp.includes('s')) {
          for (let i = 0; i < timestamp.length; i++) {
            seconds += timestamp[timestamp.length - i - 1] * 10 ** (i);
          }
        }

        timestamp = timestamp ? seconds : 0;
      }

      let ytkey;

      if (!process.env.YTTOKEN) { // Check if running github actions or just locally
        try {
          ytkey = fs.readFileSync('.yttoken', 'utf8');
        } catch (err) {
          return reject(Error('Cannot read YouTube key!'));
        }
      } else {
        ytkey = process.env.YTTOKEN;
      }

      const opts =
                    {
                      part: ['snippet', 'contentDetails'], // IMPORTANT: CONTENT DETAILS PART REQUIRED!
                      id: videoID,
                      key: ytkey
                    };

      return youtube.videos.list(opts).then(res => {
        const track = new am.Track(res.data.items[0].id, res.data.items[0].snippet.channelTitle,
          res.data.items[0].snippet.localized.title, res.data.items[0].snippet.localized.description,
          res.data.items[0].snippet.thumbnails.high.url || '', message.member.displayName,
          timestamp, res.data.items[0].contentDetails.duration);
        tracksToAdd.push(track);
        resolve(tracksToAdd);
      }, err => {
        err.message = `Unable to get video information from link! ${err.message}`;
        return reject(err);
      });
    } else if (searchTerm[0].match(/(?<=[&?]list=)(.*?)(?=(&|$))/i)) {
      const playlistId = searchTerm[0].match(/(?<=[&?]list=)(.*?)(?=(&|$))/i)[1];

      let ytkey;
      if (!process.env.YTTOKEN) { // Check if running github actions or just locally
        try {
          ytkey = fs.readFileSync('.yttoken', 'utf8');
        } catch (err) {
          return reject(Error('Cannot read YouTube key!'));
        }
      } else {
        ytkey = process.env.YTTOKEN;
      }

      const nextPage = '';

      const MAX_TRACKS_PER_PLAYLIST = 100; // multiples of 50

      const opts =
                {
                  part: ['snippet', 'status'],
                  playlistId: playlistId,
                  maxResults: 50,
                  pageToken: nextPage,
                  key: ytkey
                };

      youtube.playlistItems.list(opts).then(async res => {
        for (let i = 0; i < MAX_TRACKS_PER_PLAYLIST / res.data.pageInfo.resultsPerPage && i < Math.ceil(res.data.pageInfo.totalResults / res.data.pageInfo.resultsPerPage); i++) {
          await youtube.playlistItems.list(opts).then(async res => {
            for (let i2 = 0; i2 < res.data.items.length; i2++) {
              if (res.data.items[i2].status.privacyStatus === 'public' ||
                                         res.data.items[i2].status.privacyStatus === 'unlisted') {
                const track = new am.Track(res.data.items[i2].snippet.resourceId.videoId, res.data.items[i2].snippet.channelTitle,
                  res.data.items[i2].snippet.title, res.data.items[i2].snippet.description,
                  res.data.items[i2].snippet.thumbnails.high.url || '', message.member.displayName, 0);

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
    } else if (searchTerm[0].includes('spotify.com')) {
      spotifyHandler.getSpotifyMetadata(message, searchTerm).then(trackArray => { // is in array form
        resolve(trackArray);
      }, err => {
        reject(err);
      });
    } else {
      ytSearch(searchTerm.join(' '), message).then(track => {
        if (!track) resolve(null);
        else {
          tracksToAdd.push(track);
          resolve(tracksToAdd);
        }
      }, err => {
        reject(err);
      });
    }
  });
};

async function ytSearch (searchTerm, message) {
  return new Promise((resolve, reject) => {
    let ytkey;
    if (!process.env.YTTOKEN) { // Check if running github actions or just locally
      try {
        ytkey = fs.readFileSync('.yttoken', 'utf8');
      } catch (err) {
        return reject(Error('SEVERE: Cannot read YouTube key!'));
      }
    } else {
      ytkey = process.env.YTTOKEN;
    }

    const opts =
    {
      q: searchTerm,
      part: ['snippet'],
      maxResults: 5,
      type: ['video'],
      key: ytkey
    };

    youtube.search.list(opts).then(res => {
      const resArr = [];

      for (let i = 0; i < res.data.items.length; i++) {
        resArr.push(new am.Track(res.data.items[i].id.videoId,
          res.data.items[i].snippet.channelTitle,
          res.data.items[i].snippet.title,
          res.data.items[i].snippet.description,
          res.data.items[i].snippet.thumbnails.high.url,
          message.member.displayName));
      }

      userSelect(resArr, message).then(res => {
        resolve(res);
      }, err => {
        reject(err);
      });
    }, reason => {
      l.logError(Error(`Unable to search using googleApis! ${reason}`));
    });
  });
}

function userSelect (results, message) {
  return new Promise((resolve, reject) => {
    if (results.length === 0) {
      message.channel.send('No results for your search!');
      return resolve(null);
    }

    const reactionList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    if (results.length > reactionList.length) {
      l.logError(Error('WARNING: More results than reactions!'));
      results.length = reactionList.length;
    }

    const trackSelection = new Discord.MessageEmbed()
      .setTitle('Please make a selection: ')
      .setColor('#ff0000');

    for (let i = 0; i < results.length; i++) {
      trackSelection.addField(`${i + 1} - ${results[i].title},
            Channel: ${results[i].author}`, `https://www.youtube.com/watch?v=${results[i].videoID}`);
    }

    message.channel.send(trackSelection).then(msg => {
      const reactionTime = 30 * 1000;
      const waitTime = 5000;
      const options = { max: 1, time: reactionTime };
      let embedDeleted;
      let collected = false;

      for (let i = 0; i < results.length && i < reactionList.length; i++) {
        if (!embedDeleted) {
          msg.react(reactionList[i]).catch(reason => {
            l.logError(Error(`WARNING: Unable to add reaction to embed! Has message been deleted? ${reason}`));
          });
        }
        // most likely error is that embed has already been deleted before all reactions are added. No action necessary.
      }

      const filters = [];

      for (let i = 0; i < results.length && i < reactionList.length; i++) {
        filters.push((reaction, user) => { return reaction.emoji.name === reactionList[i] && user.id === message.author.id; });
      }

      const collectors = [];

      for (let i = 0; i < results.length && i < reactionList.length; i++) {
        collectors.push(msg.createReactionCollector(filters[i], options));
        collectors[i].on('collect', () => {
          if (collected) return;
          collected = true;
          message.client.setTimeout(() => {
            if (!embedDeleted) {
              embedDeleted = true;
              msg.delete();
            }
          }, waitTime);
          resolve(results[i]);
        });
      }

      message.client.setTimeout(() => {
        if (!embedDeleted) {
          embedDeleted = true;
          msg.delete();
        }
      }, reactionTime);
    }, err => {
      reject(err);
    });
  });
}

module.exports.getTrackObjects = getTrackObjects;
