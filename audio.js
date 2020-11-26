'use strict';

const fs = require(`fs`);
const { google } = require(`googleapis`);
const l = require(`./log.js`);
const ytdl = require(`ytdl-core`);
const youtube = google.youtube(`v3`);
const Discord = require(`discord.js`);

const DEFAULT_VOLUME = 0.25;

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
    return `LIVE`;
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

    let unescaped = origStr.replace(/\\(\*|_|`|\||~|\\)/g, `$1`);
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
        this.requestTime = new Date();

        if (!duration)
        {
            let ytkey;
            if (!process.env.YTTOKEN)   // Check if running github actions or just locally
            {
                ytkey = fs.readFileSync(`.yttoken`, `utf8`, (err, _data) => 
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
            this.duration = parseInt(duration) == duration ? duration : ConvertIsoToSec(duration);
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
        this.loopSong = false;
        this.loopQueue = false;
    }

    async play(seconds = 0, isSeek = false, repeated = 0)
    {
        try
        {
            if (this.connection !== this.voiceChannel) this.connection = await this.voiceChannel.join();
        }
        catch (err)
        {
            return new Promise.reject(err);
        }

        return new Promise( (resolve, reject) =>
        {
            this.playing = true;
            let begin = seconds !== 0 ? `${seconds}s` : `${this.songList[this.queuePos].startOffset}s`;
            if (this.queuePos > this.songList.length - 1) return reject(Error(`queuePos out of range`));
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
                    if (!this.loopSong) this.queuePos++;
                    this.seekTime = 0;
    
                    if (this.queuePos >= this.songList.length)
                    {
                        if (!this.loopQueue)
                        {
                            this.playing = false;
                            this.dispatcher.destroy();
                            this.voiceChannel.leave();
                            return;
                        }
                        else
                        {
                            this.queuePos = 0;
                            this.play().then( msg =>
                                {
                                    this.textChannel.send(msg);
                                }, err =>
                                {
                                    err.message = `WARNING: Cannot play track! ${err.message}`;
                                    l.logError(err);
                                    this.skip().catch(err1 =>
                                        { 
                                            err1.message = `WARNING: Cannot skip track! ${err.message}`;
                                            l.logError(err1); 
                                        });        
                                });
                        }
                    }
    
                    this.play().then( msg =>
                        {
                            this.textChannel.send(msg);
                        }, err =>
                        {
                            err.message = `WARNING: Cannot play track! ${err.message}`;
                            l.logError(err);
                            this.skip().catch(err1 =>
                                { 
                                    err1.message = `WARNING: Cannot skip track! ${err.message}`;
                                    l.logError(err1); 
                                });        
                        });
                })
                .on(`error`, error => 
                {
                    repeated = repeated || 0;
                    if (repeated > 4)
                    {
                        error.message = `Unable to play song after five attempts! ${error.message}`;
                        l.logError(error);
                        this.textChannel.send(`Unable to play that! Skipping...`);
                        this.skip().then( msg =>
                            {
                                this.textChannel.send(msg);
                            }, err =>
                            {
                                err.message = `WARNING: Cannot play track after an unavailable one! ${err.message}`;
                                l.logError(err);
                            });
                        return reject(error);
                    }
    
                    if (repeated === 0) l.log(`Error playing song, trying again! ${error.message}`);
                    this.play(0, isSeek, ++repeated); // test the use of return
                    return reject(error);
                });
    
            this.dispatcher.setVolume(this.volume);
            if (!isSeek && repeated === 0) return resolve(`Now playing **${this.songList[this.queuePos].title}** [${ConvertSecToFormat(this.songList[this.queuePos].duration)}], requested by **${this.songList[this.queuePos].requestedBy}** at ${this.songList[this.queuePos].requestTime.toLocaleTimeString([], {hour: `2-digit`, minute: `2-digit`})}`);
            else resolve();
        });
    }

    async add(song, playlist, playingNext)
    {
        return new Promise( (resolve, reject) =>
        {
            const oldQueueLength = this.queueDuration;
    
            this.songList.splice(playingNext ? this.queuePos + 1 : this.songList.length, 0, song);
            if (!this.playing) 
            {
                this.play().then( msg =>
                    {
                        resolve(msg);
                    }, err =>
                    {
                        reject(err);
                    });
            }
            else if (!playlist)
            {
                return resolve(`${song.title} [${ConvertSecToFormat(song.duration)}], playing in ${playingNext ? this.currentSong.duration /* this.currentSong exits because playing bool is true */ : ConvertSecToFormat(oldQueueLength)} has been added to the queue by ${song.requestedBy}`);   
            }

            else return resolve();
        });
    }

    async getQueueMessage()
    {
        return new Promise( (resolve, reject) =>
        {
            if (this.songList.length === 0) return resolve( [ `Queue is empty!` ] );
    
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
                                            .setDescription(`Looping: ${this.loopSong ? `Song` : this.loopQueue ? `Queue` : `Disabled`}`)
                                            .setAuthor('Bomborastclaat', this.textChannel.client.user.displayAvatarURL()) ];
    
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
            return resolve(queueEmbeds);
        });
    }

    async skip()
    {
        return new Promise( (resolve, reject) =>
        {
            if (this.songList.length === 0) return resolve(`No track to skip!`);
            if (this.queuePos >= this.songList.length - 1) // -1 becuase the last track is being played
            {
                if (!this.loopQueue)
                {
                    this.playing = false;
                    this.dispatcher.destroy();
                    this.voiceChannel.leave();
                    this.queuePos++;
                    return resolve(`Skipping final track: ${this.songList[this.queuePos - 1].title} and disconnecting.`);
                }
    
                else
                {
                    this.queuePos = 0;
                    this.play().then( msg =>
                        {
                            resolve(`Looping the queue!\n${msg}`);
                        }, err => 
                        {
                            reject(err);
                        });
                }
            }

            this.queuePos++;
            this.play().then( msg =>
                {
                    resolve(`Skipping ${this.songList[this.queuePos - 1].title}.\n${msg}`);
                }, err =>
                {
                    reject(err);
                });
        });
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

        this.volume = volumeAmount * DEFAULT_VOLUME;
        this.dispatcher.setVolume(this.volume);
    }

    async seek(seconds)
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
        return new Promise( (resolve, _reject) =>
        {
            const removedSong = this.songList[index];
            this.songList.splice(index, 1);
            if (this.queuePos > index) this.queuePos--;
            return resolve(`Removed Track ${index + 1}: ${removedSong.title} [${ConvertSecToFormat(removedSong.duration)}]`);
        });
    }

    async clear()
    {
        if (this.currentSong) this.songList = [ this.currentSong ];
        else this.songList = [ ];
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

    async toggleSongLoop()
    {
        this.loopSong = !this.loopSong;
    }

    async toggleQueueLoop()
    {
        this.loopQueue = !this.loopQueue;
    }
}

exports.getQueue = getQueue;
exports.deleteQueue = deleteQueue;
exports.song = song;
exports.ConvertSecToFormat = ConvertSecToFormat;
