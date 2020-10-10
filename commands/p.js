const fs = require(`fs`);
const am = require(`../audio.js`);
const { google } = require(`googleapis`);
const Discord = require(`discord.js`);
const l = require(`../log.js`);

function ytSearch(searchTerm, message, callback)
{
    var youtube = google.youtube(`v3`);

    var opts =
    {
        q: searchTerm,
        part: `snippet`,
        maxResults: 5,
        type: `video`,
        key: fs.readFileSync(`.yttoken`, `utf8`, (err, data) => { if (err) throw `SEVERE: Cannot read YouTube key!`; } )
    };

    youtube.search.list(opts)
        .then( res =>
        {
            var resArr = [];
        
            for (var i = 0; i < res.data.items.length; i++)
            {
                resArr.push(new am.song(res.data.items[i].id.videoId, res.data.items[i].snippet.channelTitle,
                        res.data.items[i].snippet.title, res.data.items[i].snippet.description,
                        res.data.items[i].snippet.thumbnails.default.url, message.author));
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

            for (var i = 0; i < results.length && i < reactionList.length; i++)
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
            
            // for (var i = 0; i < results.length && i < reactionList.length; i++)
            // {
            //         filters.push( (reaction, user) => reaction.emoji.name == reactionList[i] && user.id === message.author.id );
            //         collectors.push(msg.createReactionCollector( filters[i], options));
            //         collectors[i].on(`collect`, () => { callback(results[i]) });
            //         message.channel.send(`collector ${i} initialised!`);
            //         collectors[i].on(`collect`, () => 
            //             {
            //                 callback(results[i]);
            //             });
            // }
                    
                    // semi-dumb method
                    
                    var waitTime = 5000;
                    
                    var filters = [
                        (reaction, user) => reaction.emoji.name == reactionList[0] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[1] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[2] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[3] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[4] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[5] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[6] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[7] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[8] && user.id === message.author.id,
                        (reaction, user) => reaction.emoji.name == reactionList[9] && user.id === message.author.id 
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
    name: `p`,
    aliases: [`play`, `unpause`],
    description: `If paused, unpause, otherwise add song to queue.`,
    usage: `[song name]`,
    execute(message, args)
    {
        if (!message.member.voice.channel) return message.reply(`please join a voice channel to queue songs!`);
        if (!(message.member.voice.channel.permissionsFor(message.client.user).has(`CONNECT`)) ||
        !(message.member.voice.channel.permissionsFor(message.client.user).has(`SPEAK`)))
        return message.channel.send(`I need permissions to join and speak in your voice channel!`);
        
        var currentQueue = am.getQueue(message);

        if (!args[0])
        {
            // unpause player, if paused, then return
            return;
        }

        if (args.includes(`/[1-5]/g`))
        {
            // play third option, then return
            return;
        }

        ytSearch(args.join(` `), message, (song) => 
            {
                currentQueue.add(song, message);
                currentQueue.printQueue(message);
            });
    }
};