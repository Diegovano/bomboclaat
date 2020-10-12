const fs = require(`fs`);
const { google } = require(`googleapis`);
const l = require(`./log.js`);
const ytdl = require(`ytdl-core`);
const Discord = require(`discord.js`);

var youtube = google.youtube(`v3`);

let queueMap = new Map();

function replaceUnicode(origStr)
{
    return origStr.replace(/&amp;/gi, `&`).replace(/&#39;/gi, `'`).replace(/&quot;/gi, `"`);
}

function getQueue(message)
{
    if (queueMap[message.guild.id]) return queueMap[message.guild.id];
    return new queue(message);
}

function deleteQueue(message)
{
    if (queueMap[message.guild.id]) 
    {
        return delete queueMap[message.guild.id];
    }
    // else if (typeof(message) === typeof(queue) && queueMap[message.guildID])
    // {
    //     return delete queueMap[message.guildID];
    // }
    else l.logError(`WARNING: Attempting to delete non-existant queue!`);
}

function subArrayCumulativeLength(array)
{
    var chars = 0;
    for (var i = 0; i < array.length; i++)
    {
        chars += array[i].length;
    }

    return chars;
}

class song
{
    constructor(videoID, author, title, description, icon, requestedBy, file = undefined)
    {
        this.videoID = videoID;
        this.sourceLink = `https://www.youtube.com/watch?v=${videoID}`;
        this.author = replaceUnicode(author);
        this.title = replaceUnicode(title);
        this.description = replaceUnicode(description);
        this.icon = icon;
        this.requestedBy = requestedBy;
        this.file = file;
        var opts =
        {
            part: `contentDetails`,
            id: videoID,
            key: fs.readFileSync(`.yttoken`, `utf8`, (err, data) => { if (err) throw `SEVERE: Cannot read YouTube key!`; } )
        };
    }
}

class queue
{
    constructor(message)
    {
        this.guildID = message.guild.id;
        queueMap[this.guildID] = this;
        this.textChannel = message.channel;

        this.voiceChannel;
        this.connection;
        this.songList = [];
        this.queuePos = 0;
        this.volume = 5;
        this.playing = false;
        this.paused = false;
        this.dispatcher = false;
    }

    async play()
    {
        this.playing = true;
        try
        {
            if (this.connection !== this.voiceChannel) this.connection = await this.voiceChannel.join();
        }
        catch (err)
        {
            return l.logError(`WARNING: Unable to join voice channel!`);
        }

        if (this.queuePos > this.songList.length - 1) return l.logError(`WARNING: queuePos out of range`);
        this.dispatcher = this.connection.play(ytdl(this.songList[this.queuePos].sourceLink,
                {
                    quality: `highestaudio`,
                    highWaterMark: 1 << 25
                }))
            .on(`finish`, () =>
            {
                this.queuePos++;
                if (this.queuePos >= this.songList.length) 
                {
                    this.playing = false;
                    this.dispatcher.destroy();
                    this.voiceChannel.leave();
                    return;
                }
                this.play();
            })
            .on(`error`, error => l.logError(`WARNING: Unable to play song! ${error}`));
        
        this.textChannel.send(`Now playing ${this.songList[this.queuePos].title}, requested by ${this.songList[this.queuePos].requestedBy}`);
    }
    
    add(song, message)
    {
        if (message.channel.id !== this.textChannel.id) 
            return message.channel.send(`Bot is bound to ${message.channel.name}, please use this channel to queue!`);

        this.voiceChannel = message.member.voice.channel;
        this.songList.push(song);
        if (!this.playing) this.play();
        else message.channel.send(`${song.title} has been added to the queue by ${message.member.nickname}`);
    }

    printQueue(message)
    {
        if (message.channel.id !== this.textChannel.id) 
            return message.channel.send(`Bot is bound to ${message.channel.name}, please use this channel to see the queue!`);

        var queueMessage = `Queue for ${message.guild.name}`;

        if (this.songList.length === 0) return message.channel.send(`Queue is empty!`);
        
        if (this.queuePos !== 0) queueMessage += `\nPast Tracks:`;
        for (var i = 0; i < this.queuePos; i++) // Print past tracks
        {
            queueMessage += `\nTrack ${i + 1}: ${this.songList[i].title}, requested by ${this.songList[i].requestedBy}.`;
        }
        
        queueMessage += `\nCurrent Track:`;
        queueMessage += `\nTrack ${this.queuePos + 1}: ${this.songList[this.queuePos].title}, requested by ${this.songList[this.queuePos].requestedBy}.`;

        if (this.songList.length - 1 > this.queuePos) queueMessage += `\nUpcoming Tracks:`;
        for (i++; i < this.songList.length; i++)
        {
            queueMessage += `\nTrack ${i + 1}: ${this.songList[i].title}, requested by ${this.songList[i].requestedBy}.`;
        }

        if (queueMessage.length < 2000) message.channel.send(queueMessage);
        else
        {
            var messageArray = [];
            
            for (let i2 = 0; subArrayCumulativeLength(messageArray) < queueMessage.length; i2++)
            {
                let i3 = 0;

                if (queueMessage.length - subArrayCumulativeLength(messageArray) <= 2000)
                {
                    messageArray.push(queueMessage.substring(subArrayCumulativeLength(messageArray)));
                }

                else 
                {
                    while (queueMessage[(i2 + 1) * 2000 - i3] !== `\n`) 
                    {
                        if (i3 > 200) return l.logError(`WARNING: Unable to cut queue message on newline!`);
                        i3++;
                    }

                    messageArray.push(queueMessage.substring(i2 * 2000, (i2 + 1) * 2000 - i3));
                }
            }

            for (let i = 0; i < messageArray.length; i++)
            {
                message.channel.send(messageArray[i]);
            }
        }
    }

    skip(message)
    {
        if (message.channel.id !== this.textChannel.id) 
            return message.channel.send(`Bot is bound to ${message.channel.name}, please use this channel to skip!`);

        if (this.songList.length === 0) return message.channel.send(`No track to skip!`);
        if (this.queuePos >= this.songList.length - 1) // -1 becuase the last track is being played 
        {
            message.channel.send(`Skipping final track: ${this.songList[this.queuePos].title} and disconnecting.`);
            this.queuePos++;
            this.playing = false;
            this.dispatcher.destroy();
            this.voiceChannel.leave();
            return;
        }

        this.play();
        return message.channel.send(`Skipping ${this.songList[this.queuePos++].title},`);
    }

    getSong()
    {
        if (this.playing) return this.songList[this.queuePos];
        else throw `No track playing!`;
    }

    pause()
    {
        if (!this.playing) throw `Nothing playing!`;
        if (this.paused) throw `Player is already paused!`;

        this.paused = true;
        this.dispatcher.pause();
    }

    unpause()
    {
        if (!this.playing) throw `Noting playing!`;
        if (!this.paused) throw `Player is not paused!`;

        this.paused = false;
        this.dispatcher.resume();
    }
}

function playOnline(song)
{
    // some code here . . .
    console.dir(song);
}

exports.getQueue = getQueue;
exports.deleteQueue = deleteQueue;
exports.playOnline = playOnline;
exports.song = song;