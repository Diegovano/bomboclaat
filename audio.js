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

class song
{
    constructor(videoID, author, title, description, icon, file = undefined)
    {
        this.videoID = videoID;
        this.sourceLink = `https://www.youtube.com/watch?v=${videoID}`;
        this.author = replaceUnicode(author);
        this.title = replaceUnicode(title);
        this.description = replaceUnicode(description);
        this.icon = icon;
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
        this.textChannel = message.channel.id;

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
            if (!this.connection) this.connection = await this.voiceChannel.join();
        }
        catch (err)
        {
            return l.logError(`WARNING: Unable to join voice channel!`);
        }
        if (this.queuePos > this.songList.length - 1) return l.logError(`WARNING: queuePos out of range`);
        const dispatcher = this.connection.play(ytdl(`https://www.youtube.com/watch?v=${this.songList[this.queuePos].videoID}`,
            { filter: `audio` }))
            .on(`finish`, () =>
            {
                this.queuePos++;
                if (!(this.queuePos < this.songList.length)) 
                {
                    this.playing = false;
                    return this.voiceChannel.leave();
                }
                this.play();
            })
            .on(`error`, error => l.logError(`WARNING: Unable to play song! ${error}`));
    }
    
    add(song, message)
    {
        if (message.channel.id !== this.textChannel) 
            return message.channel.send(`Bot is bound to ${message.channel.name}, please use this channel to queue!`);

        this.voiceChannel = message.member.voice.channel;
        this.songList.push(song);
        if (!this.playing) this.play();
        message.channel.send(`${song.title} has been added to the queue by ${message.author}`);
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
exports.playOnline = playOnline;
exports.song = song;

