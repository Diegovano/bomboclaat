const fs = require(`fs`);
const { google } = require(`googleapis`);
const l = require(`./log.js`);
const ytdl = require(`ytdl-core`);
var youtube = google.youtube(`v3`);
const Discord = require(`discord.js`);

let queueMap = new Map();

function pad(num)
{
    var s = num + ``;
    while (s.length < 2) s = `0` + s;
    return s;
}

function ConvertSecToFormat(duration)
{
    const seconds = duration % 60;
    const minutes = Math.floor(duration/60) % 60;
    const hours = Math.floor(duration/3600);

    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (minutes > 0) return `${pad(minutes)}:${pad(seconds)}`;
    if (seconds > 0) return `00:${pad(seconds)}`;
    return `probably a livestream!`;
}

function ConvertIsoToSec(t)
{ 
    //dividing period from time
    var x = t.split('T'),
        time = {},
        period = {},
        //just shortcuts
        s = 'string',
        v = 'variables',
        l = 'letters',
        // store the information about ISO8601 duration format and the divided strings
        d = {
            period: {
                string: x[0].substring(1,x[0].length),
                len: 4,
                // years, months, weeks, days
                letters: ['Y', 'M', 'W', 'D'],
                variables: {}
            },
            time: {
                string: x[1],
                len: 3,
                // hours, minutes, seconds
                letters: ['H', 'M', 'S'],
                variables: {}
            }
        };
    //in case the duration is a multiple of one day
    if (!d.time.string) 
    {
        d.time.string = '';
    }

    for (var i in d) 
    {
        var len = d[i].len;
        for (var j = 0; j < len; j++) 
    {
            d[i][s] = d[i][s].split(d[i][l][j]);
            if (d[i][s].length>1) 
    {      
                d[i][v][d[i][l][j]] = parseInt(d[i][s][0], 10);
                d[i][s] = d[i][s][1];
            }
    else 
    {
                d[i][v][d[i][l][j]] = 0;
                d[i][s] = d[i][s][0];
            }
        }
    } 
    period = d.period.variables;
    time = d.time.variables;
    time.H +=   24 * period.D + 
                            24 * 7 * period.W +
                            24 * 7 * 4 * period.M + 
                            24 * 7 * 4 * 12 * period.Y;

    return(time.H * 3600 + time.M * 60 + time.S);
}

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
    else l.logError(Error(`WARNING: Attempting to delete non-existant queue!`));
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
    constructor(videoID, author, title, description, icon, requestedBy, startOffset, duration = undefined)
    {
        this.videoID = videoID;
        this.sourceLink = `https://www.youtube.com/watch?v=${videoID}`;
        this.author = replaceUnicode(author);
        this.title = replaceUnicode(title);
        this.description = replaceUnicode(description);
        this.icon = icon;
        this.requestedBy = requestedBy;
        this.startOffset = startOffset ? startOffset : 0;
        if (!duration)
        {
            var opts =
                {
                    part: `contentDetails`,
                    id: videoID,
                    key: fs.readFileSync(`.yttoken`, `utf8`, (err, data) => { if (err) throw `SEVERE: Cannot read YouTube key!`; } )
                };
            youtube.videos.list(opts).then(res => 
                {
                    //this.duration = convertDuration(res.data.items[0].contentDetails.duration);
                    this.duration = ConvertIsoToSec(res.data.items[0].contentDetails.duration);
                    // this.duration = res.data.items[0].contentDetails.duration;
                    // console.log(this.duration);
                }, reason => 
                {
                    l.logError(Error(`WARNING: Unable to get duration! ${reason}`));
                });
        }
        else
        {
            this.duration = ConvertIsoToSec(duration);
        }
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
        this.playing = false;
        this.paused = false;
        this.dispatcher = false;
        this.volume = 1;
    }

    async play(seconds = 0, isSeek = false)
    {
        try
        {
            if (this.connection !== this.voiceChannel) this.connection = await this.voiceChannel.join();
        }
        catch (err)
        {
            return l.logError(Error(`WARNING: Unable to join voice channel! ${err.message}`));
        }
        
        this.playing = true;
        let begin = seconds !== 0 ? `${seconds}s` : `${this.songList[this.queuePos].startOffset}s`;
        if (this.queuePos > this.songList.length - 1) return l.logError(Error(`WARNING: queuePos out of range`));
        this.dispatcher = this.connection.play(ytdl(this.songList[this.queuePos].sourceLink,
                {
                    quality: `highestaudio`,
                    highWaterMark: 1 << 25,
                    // begin: begin // NOT WORKING?!
                }),
                {
                    seek: begin,
                })
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
            .on(`error`, error => l.logError(Error(`WARNING: Unable to play song! ${error}`)));
        
        this.dispatcher.setVolume(this.volume);
        if (!isSeek) this.textChannel.send(`Now playing ${this.songList[this.queuePos].title}, requested by ${this.songList[this.queuePos].requestedBy}`);
    }
    
    add(song, message)
    {
        if (message.channel.id !== this.textChannel.id) 
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to queue!`);

        this.voiceChannel = message.member.voice.channel;
        this.songList.push(song);
        if (!this.playing) this.play();
        else this.textChannel.send(`${song.title} has been added to the queue by ${message.member.nickname}`);
    }

    printQueue(message)
    {
        if (message.channel.id !== this.textChannel.id)
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to see the queue!`);

        if (this.songList.length === 0) return this.textChannel.send(`Queue is empty!`);

        var pastTracks = ``;

        for (var i = 0; i < this.queuePos; i++) // Print past tracks
        {
            pastTracks += `\nTrack ${i + 1}: ${this.songList[i].title} [${ConvertSecToFormat(this.songList[i].duration)}], requested by ${this.songList[i].requestedBy}.`;
        }

        if (this.songList.length > this.queuePos)
        {
            var currentTrack = `\nTrack ${this.queuePos + 1}: ${this.songList[this.queuePos].title} [${ConvertSecToFormat(this.songList[i].duration)}], requested by ${this.songList[this.queuePos].requestedBy}.`;
        }


        var nextTracks = ``;

        for (i++; i < this.songList.length; i++)
        {
            nextTracks += `\nTrack ${i + 1}: ${this.songList[i].title} [${ConvertSecToFormat(this.songList[i].duration)}], requested by ${this.songList[i].requestedBy}.`;
        }
        /*
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
                        if (i3 > 200) return l.logError(Error(`WARNING: Unable to cut queue message on newline!`));
                        i3++;
                    }

                    messageArray.push(queueMessage.substring(i2 * 2000, (i2 + 1) * 2000 - i3));
                }
            }

            for (let i = 0; i < messageArray.length; i++)
            {
                this.textChannel.send(messageArray[i]);
            }
        }
        */

        const queueEmbed = new Discord.MessageEmbed()
                                      .setColor(`#0000ff`)
                                      .setTitle(`Queue`)
                                      .setAuthor('Bomborastclaat', message.client.user.displayAvatarURL());

        if (pastTracks !== ``)
        {
            queueEmbed.addField(`Past Track${this.queuePos > 1 ? 's' : ''}:`, pastTracks);
        }
        if (currentTrack !== ``)
        {
            queueEmbed.addField(`Current Track:`, currentTrack);
        }
        if (nextTracks !== ``)
        {
            queueEmbed.addField(`Upcoming Track${this.queuePos < this.songList.length - 2  ? 's' : ''}:`, nextTracks);
        }

        message.channel.send(queueEmbed);
    }

    skip(message)
    {
        if (message.channel.id !== this.textChannel.id) 
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to skip!`);

        if (this.songList.length === 0) return this.textChannel.send(`No track to skip!`);
        if (this.queuePos >= this.songList.length - 1) // -1 becuase the last track is being played 
        {
            this.textChannel.send(`Skipping final track: ${this.songList[this.queuePos].title} and disconnecting.`);
            this.queuePos++;
            this.playing = false;
            this.dispatcher.destroy();
            this.voiceChannel.leave();
            return;
        }

        this.play();
        return this.textChannel.send(`Skipping ${this.songList[this.queuePos++].title},`);
    }

    getSong()
    {
        if (this.playing) return this.songList[this.queuePos];
        else throw `No track playing!`;
    }

    pause()
    {
        if (!this.playing) return this.textChannel.send(`Cannot Pause: Nothing playing!`);
        if (this.paused) return this.textChannel.send(`Cannot Pause: Player is already paused!`);

        this.paused = true;
        this.dispatcher.pause();
    }

    unpause()
    {
        if (!this.playing) return this.textChannel.send(`Cannot Unpause: Noting playing!`);
        if (!this.paused) return this.textChannel.send(`Cannot Unpause: Player is not paused!`);

        this.paused = false;
        this.dispatcher.setVolume(this.volume);
        this.dispatcher.resume();
    }

    setVolume(volumeAmount)
    {
        if (!this.playing) return this.textChannel.send(`Cannot set Volume: Nothing playing!`);

        this.volume = volumeAmount;
        this.dispatcher.setVolume(this.volume);
    }

    seek(seconds, relative = false)
    {
        if (!this.playing) throw `Nothing playing!`;
        if (this.paused) throw `Player is paused!`;
        
        // if (relative)
        // {
        //     let newLocation = this.dispatcher.streamTime / 1000 + seconds;
        //     if (newLocation < this.songList[this.queuePos].duration.asSeconds() && newLocation >= 0) this.play(this.dispatcher.streamTime / 1000 + seconds, true);
        // }
        // else
        {
            if (seconds < this.songList[this.queuePos].duration)
            {
                this.play(seconds, true);
            }
            else 
            {
                this.textChannel.send(`Can't seek this far its too long bitch`);
            }
        }
    }
}

exports.getQueue = getQueue;
exports.deleteQueue = deleteQueue;
exports.song = song;
