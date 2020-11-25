'use strict';

const fs = require(`fs`);
const am = require(`../audio.js`);
const { google } = require(`googleapis`);
const Discord = require(`discord.js`);
const l = require(`../log.js`);
const youtube = google.youtube(`v3`);
const spotifyHandler = require(`../spotifyHandler.js`);


module.exports =
{
    name: `play`,
    aliases: [`p`],
    description: `If paused, unpause, otherwise add song to queue.`,
    usage: `[song name]`,
    guidOnly: true,
    async execute(message, args)
    {
        if (!message.member.voice.channel) return message.reply(`please join a voice channel to queue songs!`);
        if (!(message.member.voice.channel.permissionsFor(message.client.user).has(`CONNECT`)) ||
        !(message.member.voice.channel.permissionsFor(message.client.user).has(`SPEAK`)))
            return message.channel.send(`I need permissions to join and speak in your voice channel!`);
   
        const currentQueue = am.getQueue(message);
        
        if (message.channel.id !== currentQueue.textChannel.id)
        {
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to queue!`);
        }

        currentQueue.voiceChannel = message.member.voice.channel;
        
        if (!args[0])
        {
            try
            {
                currentQueue.unpause();
            }
            catch (error)
            {
                message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
            }
            return;
        }

        getSongObjects(message, args).then( async songs =>
            {

                if (songs.length === 1) 
                {
                    currentQueue.add(songs[0], false, false).then( msg =>
                        {
                            if (msg) message.channel.send(msg);
                        }, err =>
                        {
                            message.channel.send(err.message);
                        });
                }
                else
                {
                    message.channel.send(`Adding ${songs.length} songs to the queue!`);
                    
                    for (let i = 0; i < songs.length; i++) 
                    {
                        await currentQueue.add(songs[i], true, false).then( msg =>
                            {
                                if (msg) message.channel.send(msg);
                            }, err =>
                            {
                                message.channel.send(err.message);
                            });
                    }
                }
            },  err =>
            {
                err.message = `WARNING: Unable to get song information! ${err.message}`;
                message.channel.send(`Unable to add song to queue!`);
                return l.logError(err);
            });

    },

};

const getSongObjects = async (message, searchTerm) =>
{
    return new Promise( (resolve, reject) =>
        {
            let songsToAdd = [ ];
        
            if (searchTerm[0].match(/(?:youtu)(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i))
            {
                const videoID = searchTerm[0].match(/(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i)[1];
                
                let timestamp = 0;
                if (searchTerm[0].match(/[?&]t=/i))
                {
                    timestamp = searchTerm[0].match(/(?:[?&]t=)(.*?)(?:&|$)/i)[1];
        
                    let seconds = 0;
                    if (timestamp.includes(`h`))
                    {
                        let i = 0;
                        while (timestamp[i] !== `h`) i++;
        
                        for (let i2 = 0; i2 < i; i2++)
                        {
                            seconds += timestamp[i - i2 - 1] * 10**(i2) * 3600;
                        }
                        
                        try 
                        {      
                            timestamp[0].shift(i);
                        } 
                        catch (error) 
                        {
                            reject(error);
                        }
                    }
                    
                    if (timestamp.includes(`m`))
                    {
                        let i = 0;
                        while (timestamp[i] !== `h`) i++;
                        
                        for (let i2 = 0; i2 < i; i2++)
                        {
                            seconds += timestamp[i - i2 - 1] * 10**(i2) * 60;
                        }
        
                        try
                        {
                            timestamp[0].shift(i);
                        }
                        catch (error)
                        {
                            reject(error);
                        }
                    }
        
                    if (timestamp.includes(`s`))
                    {
                        let i = 0;
                        while (timestamp[i] !== `s`) i++;
        
                        for (let i2 = 0; i2 < i; i2++)
                        {
                            seconds += timestamp[i - i2 - 1] * 10**(i2);
                        }
                    }
                    
                    if (!timestamp.includes(`h`) && !timestamp.includes(`m`) && !timestamp.includes(`s`))
                    {
                        for (let i = 0; i < timestamp.length; i++)
                        {
                            seconds += timestamp[timestamp.length - i - 1] * 10**(i);
                        }
                    }
        
                    timestamp = seconds;
                }
        
                let ytkey;
                
                if (!process.env.YTTOKEN)   // Check if running github actions or just locally
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
                
                let opts =
                    {
                        part: [`snippet`,`contentDetails`], // IMPORTANT: CONTENT DETAILS PART REQUIRED!
                        id: videoID,
                        key: ytkey
                    };
                    
                    return youtube.videos.list(opts).then( res =>
                        {
                            const song = new am.song(res.data.items[0].id, res.data.items[0].snippet.channelTitle,
                                                        res.data.items[0].snippet.localized.title, res.data.items[0].snippet.localized.description,
                                                        res.data.items[0].snippet.thumbnails.high.url || ``, message.member.displayName,
                                                        timestamp, res.data.items[0].contentDetails.duration);
                            songsToAdd.push(song);
                            resolve(songsToAdd);
                        }, reason =>
                        {
                            l.logError(Error(`WARNING: Unable to get video information from link! ${reason}`));
                            reject(reason);
                        });
            }
        
            else if (searchTerm[0].match(/(?<=[&?]list=)(.*?)(?=(&|$))/i))
            {
                let playlistId = searchTerm[0].match(/(?<=[&?]list=)(.*?)(?=(&|$))/i)[1];
        
                let ytkey;
                if (!process.env.YTTOKEN)   // Check if running github actions or just locally
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
                
                let nextPage = ``;
                let done = false;
        
                const MAX_SONGS_PER_PLAYLIST = 100; // multiples of 50
            
                let resultsPerPage;
                let totalResults;
                
                
                const opts =
                {
                    part: [`snippet`, `status`],
                    playlistId: playlistId,
                    maxResults: 50,
                    pageToken: nextPage,
                    key: ytkey
                };
                
                youtube.playlistItems.list(opts).then( async res =>
                    {
                        for (let i = 0; i < MAX_SONGS_PER_PLAYLIST / res.data.pageInfo.resultsPerPage && i < Math.ceil(res.data.pageInfo.totalResults / res.data.pageInfo.resultsPerPage); i++)
                        {
                            await youtube.playlistItems.list(opts).then( async res =>
                                {
                                    resultsPerPage = res.data.pageInfo.resultsPerPage;
                                    totalResults = res.data.pageInfo.totalResults;

                                    for (let i2 = 0; i2 < res.data.items.length; i2++)
                                    {
                
                                        if (res.data.items[i2].status.privacyStatus !== `private`)
                                        {
                                            let song = new am.song(res.data.items[i2].snippet.resourceId.videoId, res.data.items[i2].snippet.channelTitle,
                                                                    res.data.items[i2].snippet.title, res.data.items[i2].snippet.description,
                                                                    res.data.items[i2].snippet.thumbnails.high.url || ``, message.member.displayName, 0);
                                                                    
                                            songsToAdd.push(song);
                                        }
                                    }
                                    if (res.data.nextPageToken) opts.pageToken = res.data.nextPageToken;
                                }, err =>
                                {
                                    reject(err);
                                });

                            }
                        resolve(songsToAdd);
                    }, reason =>
                    {
                        l.logError(Error(`WARNING: Unable to get playlist information from link! ${reason}`));
                        reject(reason);
                    }).then( () =>
                    {
                        // if (i + 1 > MAX_SONGS_PER_PLAYLIST / resultsPerPage) return message.channel.send(`Added ${(i + 1) * resultsPerPage} songs to the queue out of ${totalResults}!`);
                        resolve(songsToAdd);
                    });
            }
        
            else if (searchTerm[0].includes(`spotify.com`))
            {
                spotifyHandler.getSpotifyMetadata(message, searchTerm).then( songArray => // is in array form
                    {
                        resolve(songArray);
                    }, err =>
                    {
                        reject(err);
                    });
            }
        
            else ytSearch(searchTerm.join(` `), message).then( song =>
                {
                    songsToAdd.push(song);
                    resolve(songsToAdd);
                }, err =>
                {
                    reject(err);
                });
        });
};

const ytSearch = async (searchTerm, message) =>
{
    return new Promise( (resolve, reject) => 
    {
        let ytkey;
        if (!process.env.YTTOKEN)   // Check if running github actions or just locally
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
        
        const opts =
              {
                  q: searchTerm,
                  part: [`snippet`],
                  maxResults: 5,
                  type: `video`,
                  key: ytkey
              };
    
        youtube.search.list(opts).then( res =>
            {
                let resArr = [];
    
                for (let i = 0; i < res.data.items.length; i++)
                {
                    resArr.push(new am.song(res.data.items[i].id.videoId, 
                                            res.data.items[i].snippet.channelTitle,
                                            res.data.items[i].snippet.title, 
                                            res.data.items[i].snippet.description,
                                            res.data.items[i].snippet.thumbnails.high.url, 
                                            message.member.displayName));
                }
    
                userSelect(resArr, message).then( res =>
                    {
                        resolve(res);
                    }, err =>
                    {
                        reject(err);
                    });
            }, reason =>
            {
                l.logError(Error(`Unable to search using googleApis! ${reason}`));
            });
    });
};

const userSelect = (results, message) =>
{
    return new Promise( (resolve, reject) =>
    {

        if (results.length === 0) return message.channel.send(`No results for your search!`);
    
        const reactionList = [`1️⃣`,`2️⃣`,`3️⃣`,`4️⃣`,`5️⃣`,`6️⃣`,`7️⃣`,`8️⃣`,`9️⃣`,`🔟`];
    
        if (results.length > reactionList.length)
        {
            l.logError(Error(`WARNING: More results than reactions!`));
            results.length = reactionList.length;
        }
    
        const songSelection = new Discord.MessageEmbed()
                                         .setTitle(`Please make a selection: `)
                                         .setColor(`#ff0000`);
    
        for (let i = 0; i < results.length; i++) songSelection.addField(`${i + 1} - ${results[i].title},
            Channel: ${results[i].author}`, `https://www.youtube.com/watch?v=${results[i].videoID}`);
    
    
        message.channel.send(songSelection).then( msg =>
            {
                const reactionTime = 30 * 1000;
                const waitTime = 5000;
                const options = { max: 1, time: reactionTime};
                let embedDeleted;
                let collected = false;
    
                for (let i = 0; i < results.length && i < reactionList.length; i++)
                {
                    if (!embedDeleted)
                    {
                        msg.react(reactionList[i]).catch( reason =>
                            {
                                l.logError(Error(`WARNING: Unable to add reaction to embed! Has message been deleted? ${reason}`));
                            });
                    }
                    // most likely error is that embed has already been deleted before all reactions are added. No action necessary.
                }
    
                let filters = [];
    
                for (let i = 0; i < results.length && i < reactionList.length; i++)
                {    
                    filters.push( (reaction, user) => { return reaction.emoji.name === reactionList[i] && user.id === message.author.id; } );
                }
                            
                
                let collectors = [];

                for (let i = 0; i < results.length && i < reactionList.length; i++)
                {
                    collectors.push( msg.createReactionCollector( filters[i], options ));
                    collectors[i].on(`collect`, () =>
                        {
                            if (collected) return;
                            collected = true;
                            setTimeout( () =>
                                {
                                    if (!embedDeleted) msg.delete().then( () => embedDeleted = true);
                                }, waitTime);
                            resolve(results[i]);
                        });
                }
    
                setTimeout( () =>
                    {
                        if (!embedDeleted) msg.delete().then( () => embedDeleted = true);
                    }, reactionTime);

            }, err =>
            {
                reject(err);
            });
    });
};

module.exports.getSongObjects = getSongObjects;