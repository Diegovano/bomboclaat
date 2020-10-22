const fs = require(`fs`);
const am = require(`../audio.js`);
const { google } = require(`googleapis`);
const Discord = require(`discord.js`);
const l = require(`../log.js`);
const youtube = google.youtube(`v3`);
const moment = require(`moment`);

function ytSearch(searchTerm, message, callback)
{
    var opts =
    {
        q: searchTerm,
        part: `snippet`,
        maxResults: 5,
        type: `video`,
        key: fs.readFileSync(`.yttoken`, `utf8`, (err, data) => { if (err) throw `SEVERE: Cannot read YouTube key!`; } )
    };

    youtube.search.list(opts).then( res =>
        {
            var resArr = [];
        
            for (var i = 0; i < res.data.items.length; i++)
            {
                resArr.push(new am.song(res.data.items[i].id.videoId, res.data.items[i].snippet.channelTitle,
                        res.data.items[i].snippet.title, res.data.items[i].snippet.description,
                        res.data.items[i].snippet.thumbnails.default.url, message.member.nickname, 0));
            }
        
            userSelect(resArr, message, callback);
        }, reason =>
        {
            l.logError(`Unable to search using googleApis! ${reason}`);
        });
}

function userSelect(results, message, callback)
{
    var reactionList = [`1️⃣`,`2️⃣`,`3️⃣`,`4️⃣`,`5️⃣`,`6️⃣`,`7️⃣`,`8️⃣`,`9️⃣`,`🔟`];

    if (results.length > reactionList.length)
    {
        l.logError(`WARNING: More results than reactions!`);
        results.length = reactionList.length;
    }
    
    const songSelection = new Discord.MessageEmbed()
        .setTitle(`Please make a selection: `)
        .setColor(`#ff0000`);
    
    for (var i = 0; i < results.length; i++) songSelection.addField(`${i + 1} - ${results[i].title},
        Channel: ${results[i].author}`, `https://www.youtube.com/watch?v=${results[i].videoID}`);

    
    message.channel.send(songSelection).then( msg =>
        {
            var embedDeleted;

            for (let i = 0; i < results.length && i < reactionList.length; i++)
            {
                if (!embedDeleted) 
                {
                    msg.react(reactionList[i]).catch( reason =>
                        {
                            l.logError(`WARNING: Unable to add reaction to embed! Has message been deleted? ${reason}`);
                        });
                }
                // most likely error is that embed has already been deleted before all reactions are added. No action necessary.
            }
            
            // smart way but not working...
            // var filters = [];
            var collectors = [];
            var reactionTime = 30 * 1000;
            const options = { max: 1, time: reactionTime};
            
            // for (let i = 0; i < results.length && i < reactionList.length; i++)
            // {
            //     let filter = async function(reaction, user)
            //         {
            //             reaction.emoji.name === reactionList[i] && user.id === message.author.id;
            //         };

            //     filters.push(filter);
            //     // collectors.push(msg.createReactionCollector( filters[i], options));
            //     // collectors[i].on(`collect`, () => { callback(results[i]) });
            //     // message.channel.send(`collector ${i} initialised!`);
            //     // collectors[i].on(`collect`, () => 
            //     //     {
            //     //         callback(results[i]);
            //     //     });
            // }
                    
            // function makeFilters()
            // {
            //     let filterArray = [];

            //     for (let i = 0; i < results.length && i < reactionList.length; i++)
            //     {
            //         let filter = async function(reaction, user)
            //         {
            //             reaction.emoji.name === reactionList[i] && user.id === message.author.id;
            //         };

            //         filterArray.push(filter);
            //     }

            //     return filterArray;
            // }

            // let filters = makeFilters();
                   // semi-dumb method
                    
                    var waitTime = 5000;
                    
                    var filters = 
                    [
                        (reaction, user) => reaction.emoji.name === reactionList[0] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[1] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[2] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[3] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[4] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[5] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[6] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[7] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[8] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name === reactionList[9] && user.id === message.author.id 
                    ];
                    
                    var collector0 = msg.createReactionCollector( filters[0], options );
                    collector0.on('collect', () => 
                    { 
                        callback(results[0]);
                        setTimeout( () =>
                        {
                            if (!embedDeleted) msg.delete();
                            embedDeleted = true;
                        }, waitTime);
                    });
                    
                    var collector1 = msg.createReactionCollector( filters[1], options );
                    collector1.on('collect', () => 
                    {
                        callback(results[1]);
                        setTimeout( () =>
                        {
                            if (!embedDeleted) msg.delete();
                            embedDeleted = true;
                        }, waitTime);
                    });
                    
                    var collector2 = msg.createReactionCollector( filters[2], options );
                    collector2.on('collect', () => 
                    {
                        callback(results[2]);
                        setTimeout( () => 
                        {
                            if (!embedDeleted) msg.delete();
                            embedDeleted = true;
                        }, waitTime);
                    });
                    
                    var collector3 = msg.createReactionCollector( filters[3], options );
                    collector3.on('collect', () => 
                    {
                        callback(results[3]);
                        setTimeout( () =>
                        {
                            if (!embedDeleted) msg.delete();
                            embedDeleted = true;
                        }, waitTime);
                    });
                    
                    var collector4 = msg.createReactionCollector( filters[4], options );
                    collector4.on('collect', () => 
                    {
                        callback(results[4]);
                        setTimeout( () =>
                        {
                            if (!embedDeleted) msg.delete();
                            embedDeleted = true;
                        }, waitTime);
                    });

                    setTimeout( () => 
                        {
                            if (!embedDeleted) msg.delete();
                            embedDeleted = true;
                        }, reactionTime);
                });
        }

module.exports =
{
    name: `play`,
    aliases: [`p`],
    description: `If paused, unpause, otherwise add song to queue.`,
    usage: `[song name]`,
    guidOnly: true,
    execute(message, args)
    {
        if (!message.member.voice.channel) return message.reply(`please join a voice channel to queue songs!`);
        if (!(message.member.voice.channel.permissionsFor(message.client.user).has(`CONNECT`)) ||
            !(message.member.voice.channel.permissionsFor(message.client.user).has(`SPEAK`)))
        return message.channel.send(`I need permissions to join and speak in your voice channel!`);
        
        var currentQueue = am.getQueue(message);

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

        if (/[1-5]w/.test(args[0]))
        {
            // play third option, then return
            return;
        }

        if (args[0].includes(`http`))
        {
            let videoID;
            try 
            {
                let VIdRegex = /(.*?)(^|\/|v=)([a-z0-9_-]{11})(.*)?/i;
                videoID = args[0].match(VIdRegex)[3]; // https://regexr.com/3nsop
            } 
            catch (error) 
            {
                return l.logError(`WARNING: Unable to filter videoID from URL! Probably something wrong with my regex...`);
            }
            
            let timestamp = 0;
            if (args[0].includes(`t=`))
            {
                timestamp = args[0].match(/((?<=t=).*(?=(&|$)))/i)[1];
                
                let seconds = 0;
                if (timestamp.includes(`h`))
                {   
                    let i = 0;
                    while (timestamp[i] !== `h`) i++;
                    
                    for (let i2 = 0; i2 < i; i2++)
                    {
                        seconds += timestamp[i - i2 - 1] * 10**(i2) * 3600; 
                    }
                    
                    timestamp[0].shift(i);
                }
                
                if (timestamp.includes(`m`))
                {
                    let i = 0;
                    while (timestamp[i] !== `h`) i++;
                    
                    for (let i2 = 0; i2 < i; i2++)
                    {
                        seconds += timestamp[i - i2 - 1] * 10**(i2) * 60;
                    }
                    
                    timestamp[0].shift(i);
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

            var opts =
            {
                part: [`snippet`,`contentDetails`], // IMPORTANT: CONTENT DETAILS PART REQUIRED!
                id: videoID,
                key: fs.readFileSync(`.yttoken`, `utf8`, (err, data) => { if (err) throw `SEVERE: Cannot read YouTube key!`; } )
            };
            
            return youtube.videos.list(opts).then( res =>
                {
                    var song = new am.song(res.data.items[0].id, res.data.items[0].snippet.channelTitle,
                        res.data.items[0].snippet.localized.title, res.data.items[0].snippet.localized.description,
                        res.data.items[0].snippet.thumbnails.default.url, message.member.nickname, 
                        timestamp, moment.duration(res.data.items[0].contentDetails.duration, moment.ISO_8601));
                        currentQueue.add(song, message);
                }, reason =>
                {
                    l.logError(`WARNING: Unable to get video information from link! ${reason}`);
                });
            }
            
            ytSearch(args.join(` `), message, song => 
            {
                currentQueue.add(song, message);
            });
        }
    };