'use strict';

const fs = require(`fs`);
const SpotifyWebApi = require('spotify-web-api-node');
const am = require(`./audio.js`);
const l = require(`./log.js`);
const yts = require( 'yt-search' );

const spotify_tokens = JSON.parse(fs.readFileSync(`.spotify_tokens.json`, `utf-8`, (err, data) =>
    {
        if (err) throw `FATAL: Cannot read token`;
    }));

const spotifyApi = new SpotifyWebApi({
    clientId: spotify_tokens.clientId,
    clientSecret: spotify_tokens.clientSecret,
    redirectUri: spotify_tokens.redirectUri
});

spotifyApi.setAccessToken(spotify_tokens.access_token);

function parseUrl(url)
{
    const urlInfo = url.match(/(?:spotify\.com\/)(.*)(?:\/)(.*)(?:\?|$)/im);
    return urlInfo;
}

async function getYtSong(searchTerm, message, _playlist)
    {
        return new Promise( (resolve, reject) => 
        {
            yts(searchTerm).then( res => 
            {
                res.videos.slice(0, 1).forEach( res =>
                    {
                        resolve(new am.song(res.videoId, `https://www.youtube.com/watch?v=${res.videoId}`, res.title, res.description, res.thumbnail, message.member.displayName, 0, res.seconds));
                    });
            }, err => 
            {
                reject(err);
            });
        });
    }

async function getSpotifyMetadata(message, args)
    {
        return new Promise( (resolve, reject) =>
            {
                var songInfo = parseUrl(args[0]);
                switch (songInfo[1])
                {
                    case 'track':
                    spotifyApi.getTrack(songInfo[2]).then( async data =>
                        {
                            resolve([ await getYtSong(`${data.body.name} ${data.body.artists[0].name}`, message, false) ]); // return array element
                        }, err =>
                        {
                            err.message = `Unable to get track from Spotify API! Code ${err.statusCode}: ${err.message}`; // Warning added in the play command
                            message.channel.send(`Unable to play using Spotify API!`);
                            reject(err);
                        });
                    break;

                    case 'playlist':
                    spotifyApi.getPlaylist(songInfo[2]).then( async data =>
                        {
                            let songs = [ ];

                            songs.push( await getYtSong(`${data.body.tracks.items[0].track.name} ${data.body.tracks.items[0].track.artists[0].name}`, message, true) );
                            for (var i = 1; i < data.body.tracks.items.length; i++)
                            {
                                getYtSong(`${data.body.tracks.items[i].track.name} ${data.body.tracks.items[i].track.artists[0].name}`, message, true).then( res =>
                                    {
                                        songs.push(res);
                                    }, err =>
                                    {
                                        l.log(`Error adding song to queue from Spotify, continuing. ${err.message}`);
                                    });
                            }
                            resolve(songs); //CANNOT RESOLVE UNFINISHED ARRAY
                        }, err =>
                        {
                            err.message = `Unable to get playlist from Spotify API! Code ${err.statusCode}: ${err.message}`;
                            message.channel.send(`Unable to play using Spotify API!`);
                            reject(Error(err.message));
                        });
                    break;

                    case 'album':
                    spotifyApi.getAlbumTracks(songInfo[2]).then( async data =>
                        {
                            let songs = [ ];

                            songs.push(await getYtSong(`${data.body.tracks.items[0].name} ${data.body.tracks.items[0].artists[0].name}`, message, true));
                            for (var i = 1; i < data.body.tracks.items.length; i++)
                            {
                                songs.push(await getYtSong(`${data.body.tracks.items[i].name} ${data.body.tracks.items[i].artists[0].name}`, message, true));
                            }
                            resolve(songs);
                        }, err =>
                        {
                            err.message = `Unable to get playlist from Spotify API! Code ${err.statusCode}: ${err.message}`;
                            message.channel.send(`Unable to play using Spotify API!`);
                            reject(Error(err.message));
                        });
                    break;
                }
            });
    }

exports.getSpotifyMetadata = getSpotifyMetadata;
