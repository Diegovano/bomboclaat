const fs = require(`fs`);
const { google } = require(`googleapis`);
const l = require(`./log.js`);
const ytdl = require(`ytdl-core`);

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
    if (queueMap[message.guild.id]) return delete queueMap[message.guild.id];
    throw `Attempting to delete non-existant queue!`;
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
        // this.duration = youtube.videos.list(opts);
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
        const dispatcher = this.connection.play(ytdl(this.songList[this.queuePos].sourceLink,
                {
                    quality: `highestaudio`,
                    highWaterMark: 1 << 25
                }))
            .on(`finish`, () =>
            {
                this.queuePos++;
                if (this.queuePos >= this.songList.length) 
                {
                    this.voiceChannel.leave();
                    return this.playing = false;
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
        else message.channel.send(`${song.title} has been added to the queue by ${message.author}`);
    }

    printQueue(message)
    {
        
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

