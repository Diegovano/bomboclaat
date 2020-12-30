'use strict';

const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');
const am = require('./audio.js');
const l = require('./log.js');
const yts = require('yt-search');

let spotifyTokens;
try {
  spotifyTokens = JSON.parse(fs.readFileSync('.spotifyTokens.json', 'utf-8'));
} catch (err) {
  throw Error('FATAL: Cannot read token');
}

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyTokens.clientId,
  clientSecret: spotifyTokens.clientSecret,
  redirectUri: spotifyTokens.redirectUri
});

spotifyApi.setAccessToken(spotifyTokens.access_token);

function parseUrl (url) {
  const urlInfo = url.match(/(?:spotify\.com\/)(.*)(?:\/)(.*)(?:\?|$)/im);
  return urlInfo;
}

async function getYtSong (searchTerm, message, _playlist) {
  return new Promise((resolve, reject) => {
    yts(searchTerm).then(res => {
      res.videos.slice(0, 1).forEach(res => {
        resolve(new am.Song(res.videoId, `https://www.youtube.com/watch?v=${res.videoId}`, res.title, res.description, res.thumbnail, message.member.displayName, 0, res.seconds));
      });
    }, err => {
      reject(err);
    });
  });
}

async function getSpotifyMetadata (message, args) {
  return new Promise((resolve, reject) => {
    const songInfo = parseUrl(args[0]);
    switch (songInfo[1]) {
      case 'track':
        spotifyApi.getTrack(songInfo[2]).then(async data => {
          resolve([await getYtSong(`${data.body.name} ${data.body.artists[0].name}`, message, false)]); // return array element
        }, err => {
          err.message = `Unable to get track from Spotify API! Code ${err.statusCode}: ${err.message}`; // Warning added in the play command
          message.channel.send('Unable to play using Spotify API!');
          reject(err);
        });
        break;

      case 'playlist':
        spotifyApi.getPlaylist(songInfo[2]).then(async data => {
          const songs = [];

          songs.push(await getYtSong(`${data.body.tracks.items[0].track.name} ${data.body.tracks.items[0].track.artists[0].name}`, message, true));
          for (let i = 1; i < data.body.tracks.items.length; i++) {
            getYtSong(`${data.body.tracks.items[i].track.name} ${data.body.tracks.items[i].track.artists[0].name}`, message, true).then(res => {
              songs.push(res);
            }, err => {
              l.log(`Error adding song to queue from Spotify, continuing. ${err.message}`);
            });
          }
          resolve(songs); // CANNOT RESOLVE UNFINISHED ARRAY
        }, err => {
          err.message = `Unable to get playlist from Spotify API! ${err.statusCode ? `Code ${err.statusCode}:` : ''}${err.message}`;
          message.channel.send('Unable to play using Spotify API!');
          reject(Error(err.message));
        });
        break;

      case 'album':
        spotifyApi.getAlbumTracks(songInfo[2]).then(async data => {
          const songs = [];

          songs.push(await getYtSong(`${data.body.items[0].name} ${data.body.items[0].artists[0].name}`, message, true));
          for (let i = 1; i < data.body.items.length; i++) {
            songs.push(await getYtSong(`${data.body.items[i].name} ${data.body.items[i].artists[0].name}`, message, true));
          }
          resolve(songs);
        }, err => {
          err.message = `Unable to get playlist from Spotify API! Code ${err.statusCode}: ${err.message}`;
          message.channel.send('Unable to play using Spotify API!');
          reject(Error(err.message));
        });
        break;
    }
  });
}

exports.getSpotifyMetadata = getSpotifyMetadata;
