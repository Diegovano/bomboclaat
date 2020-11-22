'use strict'

const { google } = require(`googleapis`);
const fs = require(`fs`);
const SpotifyWebApi = require('spotify-web-api-node');
const am = require(`./audio.js`);
const youtube = google.youtube(`v3`);
const play = require(`./commands/play.js`);
const l = require(`./log.js`)
const yts = require( 'yt-search' )

const spotify_tokens = JSON.parse(fs.readFileSync(`.spotify_tokens.json`, `utf-8`, (err, data) =>
{
    if (err) throw `FATAL: Cannot read token`;
}))

var spotifyApi = new SpotifyWebApi({
    clientId: spotify_tokens.clientId,
    clientSecret: spotify_tokens.clientSecret,
    redirectUri: spotify_tokens.redirectUri
});

spotifyApi.setAccessToken(spotify_tokens.access_token)

function parseUrl(url)
{
    const urlInfo = url.match(/(?:spotify\.com\/)(.*)(?:\/)(.*)(?:\?|$)/im);
    return urlInfo;
}

async function getYtInfo(searchTerm, message, playlist)
{
    let ytkey;
    if (!process.env.YTTOKEN)
    {
        ytkey = fs.readFileSync(`.yttoken`, `utf8`, (err, data) =>
            {
                if (err) throw `SEVERE: Cannot read YouTube key!`;
            });
    }
    else
    {
        ytkey = process.env.YTTOKEN;
    }

    var currentQueue = am.getQueue(message);

    const r = await yts(searchTerm);
    r.videos.slice(0,1).forEach( function (v) {
        var song = new am.song(v.videoId, `https://www.youtube.com/watch?v=${v.videoId}`, v.title, v.description, v.thumbnail, message.member.displayName, 0, v.seconds);
        currentQueue.add(song, message, playlist);
    })
}

function getSpotifyMetadata(message, args)
{
    var songInfo = parseUrl(args[0]);
    switch (songInfo[1]) {
        case 'track':
            spotifyApi.getTrack(songInfo[2]).then(
                async function(data) {
                    await getYtInfo(`${data.body.name} ${data.body.artists[0].name}`, message, false);
                },
                function(err) {
                    console.error(err);
                });
            break;

        case 'playlist':
            spotifyApi.getPlaylist(songInfo[2]).then(
                async function(data) {
                    await getYtInfo(`${data.body.tracks.items[0].track.name} ${data.body.tracks.items[0].track.artists[0].name}`, message, true);
                    for (var i = 1; i < data.body.tracks.items.length; i++)
                        {
                            await getYtInfo(`${data.body.tracks.items[i].track.name} ${data.body.tracks.items[i].track.artists[0].name}`, message, true);
                        }
                },
                function(err){
                    console.log(err);
                }
            )
            break;

        case 'artist':
            spotifyApi.getArtistTopTracks(songInfo[2]).then(
                function(data) {
                    console.log(data)
                    for (var i = 0; i < 10; i++)
                        {
                            getYtInfo(`this doesnt work`);
                        }
                },
                function(err) {
                    console.log(err);
                }
            )
            break;
    }
}

exports.getSpotifyMetadata = getSpotifyMetadata;
