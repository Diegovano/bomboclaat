'use strict';

const fs = require(`fs`);
const { google } = require(`googleapis`);
const l = require(`./log.js`);
const ytdl = require(`ytdl-core`);
const youtube = google.youtube(`v3`);
const Discord = require(`discord.js`);

const DEFAULT_VOLUME = 0.05;

let queueMap = new Map();

function pad(num)
{
    let s = num + ``;
    while (s.length < 2) s = `0` + s;
    return s;
}

function ConvertSecToFormat(duration)
{
    duration = Math.round(duration);
    const seconds = duration % 60;
    const minutes = Math.floor(duration/60) % 60;
    const hours = Math.floor(duration/3600);

    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (minutes > 0) return `${pad(minutes)}:${pad(seconds)}`;
    if (seconds > 0) return `00:${pad(seconds)}`;
    return `LIVE!`;
}

function ConvertIsoToSec(t)
{
    const regex = /P((([0-9]*\.?[0-9]*)Y)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)W)?(([0-9]*\.?[0-9]*)D)?)?(T(([0-9]*\.?[0-9]*)H)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)S)?)?/;    // Thanks regex101.com
    const matches = t.match(regex);
    const sum = parseInt(matches[16] || 0) + parseInt((matches[14] * 60) || 0) + parseInt((matches[12] * 3600) || 0) + parseInt((matches[10] * 86400) || 0);    // || to remove undefined
    return sum;    // Doing up to a day
}


function replaceUnicode(origStr)  //and escape markdown
{
    origStr = origStr.replace(/&amp;/gi, `&`)
                  .replace(/&#39;/gi, `'`)
                  .replace(/&quot;/gi, `"`);

    let unescaped = origStr.replace(/\\(\*|_|`|~|\\)/g, `$1`);
    return unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1');
}

function getQueue(message)
{
    if (queueMap[message.guild.id]) return queueMap[message.guild.id];
    return new queue(message);
}

function deleteQueue(message, suppressWarning = false)
{
    if (queueMap[message.guild.id])
    {
        return delete queueMap[message.guild.id];
    }
    else if (!suppressWarning) message.channel.send(`No queue exists!`);
}

function embedOutLimits(embed)
{
    let reason = ``;

    // if (!embed) return `Embed empty!`;

    if (embed.description > 2048) reason += `Embed descriptions are limited to 2048 characters. `; // reason ends with . + space to ensure correct presentation of multiple fails.
    if (embed.fields && embed.fields.length > 25) reason += `Embeds can have up to 25 fields. `;
    
    for (let i = 0; embed.fields && i < embed.fields.length; i++)
    {
        if (embed.fields[i].name.length > 256) reason += `A field's name is limited to 256 characters. `;
        if (embed.fields[i].value.length > 1024) reason += `A field's value is limited to 1024 characters. `;
    }
    
    if (embed.footer && embed.footer.text.length > 2048) reason += `The footer text is limited to 2048 characters. `;
    if (embed.author && embed.author.name.length > 256) reason += `The author name is limited to 256 characters. `;
    if (embed.length + (embed.author ? embed.author.name.length : 0) > 6000) reason += `The sum of all characters in an embed structure must not exceed 6000 characters. `;

    return reason === `` ? null : reason;
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
                    part: `contentDetails`,
                    id: videoID,
                    key: ytkey
                };
            youtube.videos.list(opts).then(res =>
                {
                    this.duration = ConvertIsoToSec(res.data.items[0].contentDetails.duration);
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
        this.volume = DEFAULT_VOLUME;
        this.seekTime = 0;
    }

    async play(seconds = 0, isSeek = false, repeated = 0)
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
                }),
                {
                    seek: begin,
                })
            .on(`finish`, () =>
            {
                this.queuePos++;
                this.seekTime = 0;

                if (this.queuePos >= this.songList.length)
                {
                    this.playing = false;
                    this.dispatcher.destroy();
                    this.voiceChannel.leave();
                    return;
                }
                this.play();
            })
            .on(`error`, error => 
            {
                repeated = repeated || 0;
                if (repeated > 4)
                {
                    l.log(`Unable to play song! ${error.message}`);
                    this.textChannel.send(`Unable to play that! Skipping...`);
                    return this.skip();
                }

                l.log(`Error playing song, trying again! ${error.message}`);
                return this.play(0, isSeek, ++repeated); // test the use of return
            });

        this.dispatcher.setVolume(this.volume);
        if (!isSeek && repeated === 0) this.textChannel.send(`Now playing ***${this.songList[this.queuePos].title}*** [${ConvertSecToFormat(this.songList[this.queuePos].duration)}], requested by **${this.songList[this.queuePos].requestedBy}**`);
    }

    async add(song, message, playlist)
    {
        if (message.channel.id !== this.textChannel.id)
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to queue!`);

        const oldQueueLength = this.queueDuration;

        this.voiceChannel = message.member.voice.channel;
        this.songList.push(song);
        if (!this.playing) await this.play();
        else if (!playlist) this.textChannel.send(`${song.title} [${ConvertSecToFormat(song.duration)}], *playing in ${ConvertSecToFormat(oldQueueLength)} has been added to the queue by ${song.requestedBy}`);
    }

    async printQueue(message)
    {
        if (message.channel.id !== this.textChannel.id)
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to see the queue!`);

        if (this.songList.length === 0) return this.textChannel.send(`Queue is empty!`);

        let pastTracks = [``];

        for (let i = 0, i2 = 0; i < this.queuePos; i++)
        {
            const trackAppend = `\nTrack ${i + 1}: [${this.songList[i].title}](${this.songList[i].sourceLink}) [${ConvertSecToFormat(this.songList[i].duration)}], requested by ${this.songList[i].requestedBy}.`;
            if (pastTracks[i2].length + trackAppend.length < 1024) pastTracks[i2] += trackAppend;
            else
            {
                i2++;
                pastTracks.push(trackAppend);
            }
        }

        let currentTrack = [``];

        if (this.songList.length > this.queuePos)
        {
          let trackDuration = this.songList[this.queuePos].duration;
          currentTrack[0] = `\nTrack ${this.queuePos + 1}: [${this.songList[this.queuePos].title}](${this.songList[this.queuePos].sourceLink}) [${ConvertSecToFormat(trackDuration)}], requested by ${this.songList[this.queuePos].requestedBy}.`;
        }

        let nextTracks = [``];



        for (let i = this.queuePos + 1, i2 = 0; i < this.songList.length; i++)
        {
            let trackDuration = this.songList[i].duration;
            const trackAppend = `\nTrack ${i + 1}: [${this.songList[i].title}](${this.songList[i].sourceLink}) [${ConvertSecToFormat(trackDuration)}], requested by ${this.songList[i].requestedBy}.`;
            if (nextTracks[i2].length + trackAppend.length < 1024) nextTracks[i2] += trackAppend;
            else
            {
                i2++;
                nextTracks.push(trackAppend);
            }
        }

        let queueEmbeds = [ new Discord.MessageEmbed()
                                     .setColor(`#0000ff`)
                                     .setTitle(`Queue [${this.queueDuration !== 0 ? ConvertSecToFormat(this.queueDuration) : ` no upcoming tracks `}]`)
                                     .setAuthor('Bomborastclaat', message.client.user.displayAvatarURL()) ];

        let i2 = 0;
        if (pastTracks[0] !== ``)
        {
            for (let i = 0; i < pastTracks.length; i++)
            {
                const fieldToAdd = { name: i === 0 ? `Past Track${this.queuePos > 1 ? 's' : ''}:` : `continued...`, value: pastTracks[i] };
                if (queueEmbeds[i2].length + (queueEmbeds.author ? queueEmbeds[i2].author.name.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000) queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
                else
                {
                    queueEmbeds.push( new Discord.MessageEmbed().setColor(`#0000ff`) );
                    
                    queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
                }
            }
        }
        if (currentTrack[0] !== ``)
        {
            const fieldToAdd = { name: `Current Track:`, value: currentTrack[0] };
            if (queueEmbeds[i2].length + (queueEmbeds.author ? queueEmbeds[i2].author.name.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000) queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
            else
            {
                queueEmbeds.push( new Discord.MessageEmbed().setColor(`#0000ff`) );

                queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
            }

            queueEmbeds[i2].setThumbnail(this.songList[this.queuePos].icon);
        }
        if (nextTracks[0] !== ``)
        {
            for (let i = 0; i < nextTracks.length; i++)
            {
                const fieldToAdd = { name: i === 0 ? `Upcoming Track${this.queuePos < this.songList.length - 2  ? 's' : ''}:` : `continued...`, value: nextTracks[i] };
                if (queueEmbeds[i2].length + (queueEmbeds.author ? queueEmbeds[i2].author.name.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000) queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
                else
                {
                    queueEmbeds.push( new Discord.MessageEmbed().setColor(`#0000ff`) );
    
                    queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
                }
            }
        }
                         
        // l.log(`Printing ${queueEmbeds.length} Embeds!`);
        for (let i = 0; i < queueEmbeds.length; i++)
        {
            message.channel.send(queueEmbeds[i])
                .catch(error => l.logError(Error(`WARNING: Unable to create queue embed! Is it within character limits? ${error.message}`)));
        }
    }

    async skip(message = null)
    {
        if (message && message.channel.id !== this.textChannel.id)
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
        return this.textChannel.send(`Skipping ${this.songList[this.queuePos++].title}.`);
    }

    get currentSong() // keep sync as function return an object
    {
        if (this.playing) return this.songList[this.queuePos];
        else return null;
    }

    get timestamp()
    {
        return Math.round((this.seekTime !== 0 ? this.seekTime : this.songList[this.queuePos].startOffset ) + ( this.dispatcher.streamTime / 1000 ));
    }

    get queueDuration()
    {
        let duration = 0;
        for (let i = this.queuePos + 1; i < this.songList.length; i++)  duration += this.songList[i].duration;
        duration += this.currentSong ? this.currentSong.duration - this.timestamp : 0;

        return duration;
    }

    async pause()
    {
        if (!this.playing) return this.textChannel.send(`Cannot Pause: Nothing playing!`);
        if (this.paused) return this.textChannel.send(`Cannot Pause: Player is already paused!`);

        this.paused = true;
        this.dispatcher.pause();
    }

    async unpause()
    {
        if (!this.playing) return this.textChannel.send(`Cannot Unpause: Nothing playing!`);
        if (!this.paused) return this.textChannel.send(`Cannot Unpause: Player is not paused!`);

        this.paused = false;
        this.dispatcher.setVolume(this.volume);
        this.dispatcher.resume();
    }

    async setVolume(volumeAmount)
    {
        if (!this.playing) return this.textChannel.send(`Cannot set Volume: Nothing playing!`);

        this.volume = volumeAmount;
        this.dispatcher.setVolume(this.volume);
    }

    async seek(seconds, relative = false)
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
                this.seekTime = parseInt(seconds);
                this.play(seconds, true);
            }
            else
            {
                this.textChannel.send(`Can't seek this far its too long bitch`);
            }
        }
    }

    async remove(index)
    {
        this.songList.splice(index, 1);
    }

    async clear()
    {
        this.songList = [ this.currentSong ? this.currentSong : undefined ];
        this.queuePos = 0;
    }

    async infoEmbed(pos = this.queuePos)
    {
        if (pos >= this.songList.length) throw Error(`Song number out of range!`);

        const PROGRESS_BAR_LENGTH = 25;

        let infoEmbed = new Discord.MessageEmbed()
                            .setColor(`#ff0000`)
                            .setTitle(`Song Information`)
                            .addField(`Song Title`, `[${this.songList[pos].title}](${this.songList[pos].sourceLink}) [${ConvertSecToFormat(this.songList[pos].duration)}]`);

        try
        {
            if (pos === this.queuePos)
            {
                let progressBar = `>`;
    
                let i = 0;
                for (; i < Math.round((this.timestamp / this.currentSong.duration) * PROGRESS_BAR_LENGTH); i++)
                {
                    progressBar += `█`;
                }
                for (; i < PROGRESS_BAR_LENGTH; i++)
                {
                    progressBar += `░`;
                }
                progressBar += `<`;

                infoEmbed.addField(`Song Progress`, `${progressBar} \u0009 [${ConvertSecToFormat(Math.round(this.timestamp))} / ${ConvertSecToFormat(this.currentSong.duration)}]`);
            }

            else if (pos > this.queuePos)
            {
                let cumulativeSeconds = 0;
                for (let i = 1; i < pos - this.queuePos; i++) cumulativeSeconds += this.songList[pos + i].duration;
                infoEmbed.addField(`Time to Play`, `${ConvertSecToFormat(this.currentSong.duration - this.timestamp + cumulativeSeconds)}`);
            }

            infoEmbed.addFields({ name : `Author`, value : this.songList[pos].author },
                                { name : `Requested by:`, value : this.songList[pos].requestedBy })
                                .setImage(this.songList[pos].icon)
                                .setTimestamp();
                                
            return infoEmbed;
        } 
        catch (err) 
        {
            err.message = `WARNING: Cannot send embed: ${err.message}`;
            l.logError(err);
        }

    }
}

exports.getQueue = getQueue;
exports.deleteQueue = deleteQueue;
exports.song = song;
exports.ConvertSecToFormat = ConvertSecToFormat;
