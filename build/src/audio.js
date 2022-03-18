'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueMap = exports.Queue = exports.Track = exports.deleteQueue = exports.getQueue = exports.ConvertSecToFormat = void 0;
const Discord = __importStar(require("discord.js"));
const Voice = __importStar(require("@discordjs/voice"));
const googleapis_1 = require("googleapis");
const fs_1 = require("fs");
const log_1 = require("./log");
const ytdl = require("ytdl-core");
const types_1 = require("./types");
const youtube = googleapis_1.google.youtube('v3');
const DEFAULT_VOLUME = 0.15;
const DISABLE_ACCENT_QUEUE = true;
function pad(num) {
    let s = num + '';
    while (s.length < 2)
        s = '0' + s;
    return s;
}
/**
 * Convert duration in seconds to fomatted string.
 * @param duration Number of seconds
 * @returns string formatted in HH:MM:SS
 */
function ConvertSecToFormat(duration) {
    duration = Math.round(duration);
    const seconds = duration % 60;
    const minutes = Math.floor(duration / 60) % 60;
    const hours = Math.floor(duration / 3600);
    if (hours > 0)
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (minutes > 0)
        return `${pad(minutes)}:${pad(seconds)}`;
    if (seconds > 0)
        return `00:${pad(seconds)}`;
    else
        return '00:00';
}
exports.ConvertSecToFormat = ConvertSecToFormat;
/**
 * Convert strings formatted in ISO 8601 to duration in seconds.
 * @param ISO String in ISO 8601 format
 * @returns The duration entered in seconds
 */
function ConvertIsoToSec(ISO) {
    var _a, _b, _c, _d;
    const regex = /P((([0-9]*\.?[0-9]*)Y)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)W)?(([0-9]*\.?[0-9]*)D)?)?(T(([0-9]*\.?[0-9]*)H)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)S)?)?/; // Thanks regex101.com
    const matches = ISO.match(regex);
    if (matches === null)
        return null;
    else {
        const sum = parseInt((_a = matches[16]) !== null && _a !== void 0 ? _a : '0') + parseInt((_b = matches[14]) !== null && _b !== void 0 ? _b : '0') * 60 + parseInt((_c = matches[12]) !== null && _c !== void 0 ? _c : '0') * 3600 + parseInt((_d = matches[9]) !== null && _d !== void 0 ? _d : '0') * 86400;
        return sum; // Doing up to a day
    }
}
/**
 * Replace HTML character codes with UTF-8 equivalents and escape markdown.
 * @param origStr string to precess
 * @returns prrocessed string
 */
function replaceUnicode(origStr) {
    origStr = origStr.replace(/&amp;/gi, '&')
        .replace(/&#39;/gi, '\'')
        .replace(/&quot;/gi, '"');
    const unescaped = origStr.replace(/\\(\*|_|`|\||~|\\)/g, '$1');
    return unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1');
}
/**
 * Attemps to join a voice channel.
 * @param channel the voice channel to connect to
 */
function connectVoice(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const connection = Voice.joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            });
            connection.on('stateChange', (_oldState, newState) => __awaiter(this, void 0, void 0, function* () {
                // if (newState.status === Voice.VoiceConnectionStatus.Ready) { log('connected!'); return resolve(connection); }
                if (newState.status === Voice.VoiceConnectionStatus.Disconnected && newState.reason !== 3) {
                    if (newState.reason === Voice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                        /*
                          If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                          but there is a chance the connection will recover itself if the reason of the disconnect was due to
                          switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                          so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                          the voice connection.
                          */
                        try {
                            yield Voice.entersState(connection, Voice.VoiceConnectionStatus.Connecting, 5000);
                            // Probably moved voice channel
                        }
                        catch (_a) {
                            // connection.destroy();
                            // return reject(Error('Unable to connect to voice channel!'));
                            // Probably removed from voice channel
                        }
                    }
                    else if (connection.rejoinAttempts < 5) {
                        /*
                        The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
                        */
                        (0, types_1.wait)((connection.rejoinAttempts + 1) * 5000).then(() => connection.rejoin()).catch(err => (0, log_1.logError)(err));
                    }
                    else {
                        /*
                          The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                        */
                        // connection.destroy();
                    }
                }
            }));
            connection.on('error', error => (0, log_1.logError)(error));
            return Voice.entersState(connection, Voice.VoiceConnectionStatus.Ready, 5000).then(resolve, reject);
        });
    });
}
/**
 * Fetch the queue asociated to the guild. If none exists creates one.
 * @param guild The guild whose queue to retrieve
 * @returns The queue associated to the guild given as an argument
 */
function getQueue(guild) {
    const queue = exports.queueMap.get(guild.id);
    if (queue)
        return queue;
    else
        return new Queue(guild);
}
exports.getQueue = getQueue;
/**
 * Attempt to delete the queue associated to a guild.
 * @param guild The guild whose queue to delete
 * @param suppressWarning Whether or not to silence a warning if no queue exists associated to that guild
 * @returns `true` if the queue is successfully deleted, `false` otherwise
 */
function deleteQueue(guild, suppressWarning = false) {
    if (!exports.queueMap.has(guild.id)) {
        if (!suppressWarning)
            (0, log_1.log)('Cannot delete queue: no queue exists on that guild!');
        return false;
    }
    exports.queueMap.delete(guild.id);
    return true;
}
exports.deleteQueue = deleteQueue;
/**
 * Get the link to the audio resource used to play text to speech with accents.
 * @param language the accent to use
 * @param text the text to read out
 * @returns A URL HREF
 */
function getTTSLink(language, text) {
    return new URL(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${text}`).href;
}
/**
 * Class for audio Tracks
 */
class Track {
    constructor(videoID, author, title, description, icon, requestedBy, startOffset, duration) {
        this.videoId = videoID;
        this.sourceLink = `https://www.youtube.com/watch?v=${videoID}`;
        this.author = replaceUnicode(author);
        this.title = replaceUnicode(title);
        this.description = replaceUnicode(description);
        this.icon = icon;
        this.requestedBy = requestedBy;
        this.startOffset = startOffset || 0;
        this.requestTime = new Date();
        if (!duration) {
            this.duration = 0; // set base value to duration
            let ytkey;
            if (!process.env.YTTOKEN) { // Check if running github actions or just locally
                try {
                    ytkey = (0, fs_1.readFileSync)('.yttoken', 'utf8');
                }
                catch (err) {
                    (0, log_1.logError)(Error('Cannot read YouTube key!'));
                    return;
                }
            }
            else {
                ytkey = process.env.YTTOKEN;
            }
            const opts = {
                part: ['contentDetails'],
                id: [videoID],
                key: ytkey
            };
            youtube.videos.list(opts).then(res => {
                var _a, _b, _c;
                if (!res.data.items) {
                    (0, log_1.logError)(Error('WARNING: Unable to get duration!'));
                }
                else
                    this.duration = (_c = ConvertIsoToSec((_b = (_a = res.data.items[0].contentDetails) === null || _a === void 0 ? void 0 : _a.duration) !== null && _b !== void 0 ? _b : '')) !== null && _c !== void 0 ? _c : 0; // if there is a problem set duration to 0
            }, reason => {
                (0, log_1.logError)(Error(`WARNING: Unable to get duration! ${reason}`));
            });
        }
        else {
            this.duration = duration;
        }
    }
}
exports.Track = Track;
/**
 * Class for queues
 */
class Queue {
    constructor(guild) {
        this.guildId = guild.id;
        this.client = guild.client;
        exports.queueMap.set(this.guildId, this);
        this.voiceChannel = null;
        this.connection = null;
        this.trackList = [];
        this.queuePos = 0;
        this.playing = false;
        this.paused = false;
        this.playAttempts = 0;
        this.isSeek = false;
        this.trackAudioPlayer = new Voice.AudioPlayer({ behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Pause } })
            .on('stateChange', (oldState, newState) => {
            var _a, _b;
            if (newState.status === Voice.AudioPlayerStatus.Playing)
                this.playAttempts = 0;
            if (oldState.status === Voice.AudioPlayerStatus.Playing && newState.status === Voice.AudioPlayerStatus.Idle) {
                if (!this.loopTrack)
                    this.queuePos++;
                this.seekTime = 0;
                if (this.queuePos >= this.trackList.length) {
                    if (!this.loopQueue) {
                        this.playing = false;
                        (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
                        this.subscription = undefined;
                        (_b = this.connection) === null || _b === void 0 ? void 0 : _b.disconnect();
                        return;
                    }
                    else {
                        this.queuePos = 0;
                        this.play().then(msg => {
                            var _a;
                            if (msg)
                                (_a = this.textChannel) === null || _a === void 0 ? void 0 : _a.send(msg);
                        }, err => {
                            err.message = `WARNING: Cannot play track! ${err.message}`;
                            (0, log_1.logError)(err);
                            this.skip().catch(err1 => {
                                err1.message = `WARNING: Cannot skip track! ${err.message}`;
                                (0, log_1.logError)(err1);
                            });
                        });
                    }
                }
                this.play().then(msg => {
                    var _a;
                    if (msg)
                        (_a = this.textChannel) === null || _a === void 0 ? void 0 : _a.send(msg);
                }, err => {
                    err.message = `WARNING: Cannot play track! ${err.message}`;
                    (0, log_1.logError)(err);
                    this.skip().catch(err1 => {
                        err1.message = `WARNING: Cannot skip track! ${err.message}`;
                        (0, log_1.logError)(err1);
                    });
                });
            }
        })
            .on('error', err => {
            var _a;
            if (this.playAttempts > 4) {
                err.message = `Unable to play track after five attempts! ${err.message}`;
                (0, log_1.logError)(err);
                (_a = this.textChannel) === null || _a === void 0 ? void 0 : _a.send('Unable to play that! Skipping...');
                this.skip().then(msg => {
                    var _a;
                    if (msg)
                        (_a = this.textChannel) === null || _a === void 0 ? void 0 : _a.send(msg);
                }, err => {
                    err.message = `WARNING: Cannot play track after an unavailable one! ${err.message}`;
                    (0, log_1.logError)(err);
                });
            }
            if (this.playAttempts === 0)
                (0, log_1.log)(`Error playing track, trying again! ${err.message}`);
            this.play(this.timestamp, this.isSeek, ++this.playAttempts); // test the use of return
        });
        this.volume = DEFAULT_VOLUME;
        this.seekTime = 0;
        this.loopTrack = false;
        this.loopQueue = false;
        this.accentAudioPlayer = new Voice.AudioPlayer({ behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Pause } });
        this.languages = ['fr', 'de', 'ru', 'ja', 'zh', 'en', 'it', 'es', 'ko', 'pt', 'sw', 'nl', 'en_nz', 'en_au', 'fr_ca', 'hi', 'en_us'];
        this.accentList = [];
        this.playingAccent = false;
        this.accentTimeoutId = undefined;
        this.stopTimestamp = null;
    }
    /**
     * Assign a certain voice channel to the queue and check the bot has connect and speak permissions. Then join that channel.
     * @param voiceChannel The voice channel to join
     * @returns A voice promise that will resolve once a connection has successfully been established.
     */
    setVoiceChannel(voiceChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.client.guilds.fetch(this.guildId).then((guild) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const clientGuildMem = guild.client.user ? yield guild.members.fetch((_a = guild.client.user) === null || _a === void 0 ? void 0 : _a.id).catch(err => reject(err)) : null;
                    if (clientGuildMem && voiceChannel.permissionsFor(clientGuildMem).has(['CONNECT', 'SPEAK'])) {
                        this.voiceChannel = voiceChannel;
                        this.connection = (_b = yield connectVoice(voiceChannel).catch(err => reject(err))) !== null && _b !== void 0 ? _b : null;
                        return resolve();
                    }
                    else
                        return reject(Error('Insufficent permissions in that voice channel!'));
                }), err => reject(err));
            });
        });
    }
    /**
     * Connect to a voice channel, then current track in the queue.
     * @param seconds the number of seconds to start playing at
     * @param isSeek whether or not the current operation is a seek operation. If not then a confimation message will be sent to the bound text channel
     * @returns {Promise<string | void>} the string represents the message to be sent describing the operation, for example "now playing x", or void if no message
     */
    play(seconds = 0, isSeek = false, repeated = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accentTimeoutId) {
                clearTimeout(this.accentTimeoutId);
                this.accentTimeoutId = undefined;
            }
            try {
                if (!this.voiceChannel)
                    throw Error('WARNING: No voice channel allocated to this queue!');
                this.connection = yield connectVoice(this.voiceChannel).catch(err => Promise.reject(err));
            }
            catch (err) {
                return Promise.reject(err);
            }
            return new Promise((resolve, reject) => {
                var _a, _b;
                this.playing = true;
                this.subscription = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.subscribe(this.trackAudioPlayer);
                const begin = seconds !== 0 ? `${seconds}s` : `${this.trackList[this.queuePos].startOffset}s`;
                if (this.queuePos > this.trackList.length - 1)
                    return reject(Error('queuePos out of range'));
                this.trackAudioResource = Voice.createAudioResource(ytdl(this.trackList[this.queuePos].sourceLink, {
                    // seek: parseInt(begin.split('s')[0]),
                    begin: begin,
                    filter: 'audioonly'
                    // quality: 'highestaudio',
                    // highWaterMark: 1 << 25
                }), {
                    metadata: this.trackList[this.queuePos],
                    inlineVolume: true
                });
                this.trackAudioPlayer.play(this.trackAudioResource);
                this.setVolume(this.volume);
                if (!isSeek && repeated === 0)
                    return resolve(`Now playing **${this.trackList[this.queuePos].title}** [${ConvertSecToFormat((_b = this.trackList[this.queuePos]) === null || _b === void 0 ? void 0 : _b.duration)}], requested by **${this.trackList[this.queuePos].requestedBy}** at ${this.trackList[this.queuePos].requestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                else
                    resolve();
            });
        });
    }
    /**
     * Add new tracks to the queue.
     * @param track The track to add to the queue
     * @param playlist Whether or not the track is in a playlist (affects confirmation message sent)
     * @param playingNext Whether or not to put track in the next position in the queue.
     * @returns A promise that can resolve to a `string` (this is the confirmation message that can be sent to the text channel) or `null`
     */
    add(track, playlist, playingNext) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a, _b;
                const oldQueueLength = this.queueDuration;
                this.trackList.splice(playingNext ? this.queuePos + 1 : this.trackList.length, 0, track);
                if (!this.playing) {
                    this.play().then(msg => {
                        resolve(msg);
                    }, err => {
                        reject(err);
                    });
                }
                else if (!playlist) {
                    return resolve(`${track.title} [${ConvertSecToFormat(track.duration)}], playing in ${playingNext ? ConvertSecToFormat((_b = (_a = this.currentTrack) === null || _a === void 0 ? void 0 : _a.duration) !== null && _b !== void 0 ? _b : 0) /* this.currentTrack exits because playing bool is true */ : ConvertSecToFormat(oldQueueLength)} has been added to the queue by ${track.requestedBy}`);
                }
                else
                    return resolve();
            });
        });
    }
    /**
     * Get embeds containing the full queue, past, current, and upcoming tracks.
     * @returns A promise that resolves to the array of embeds containing the queue or the message "Queue is empty!"
     */
    getQueueMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                var _a, _b, _c, _d;
                if (this.trackList.length === 0)
                    return resolve('Queue is empty!');
                const pastTracks = [''];
                for (let i = 0, i2 = 0; i < this.queuePos; i++) {
                    const trackAppend = `\nTrack ${i + 1}: [${this.trackList[i].title}](${this.trackList[i].sourceLink}) [${ConvertSecToFormat(this.trackList[i].duration)}], requested by ${this.trackList[i].requestedBy}.`;
                    if (pastTracks[i2].length + trackAppend.length < 1024)
                        pastTracks[i2] += trackAppend;
                    else {
                        i2++;
                        pastTracks.push(trackAppend);
                    }
                }
                const currentTrack = [''];
                if (this.trackList.length > this.queuePos) {
                    const trackDuration = this.trackList[this.queuePos].duration;
                    currentTrack[0] = `\nTrack ${this.queuePos + 1}: [${this.trackList[this.queuePos].title}](${this.trackList[this.queuePos].sourceLink}&t=${Math.floor(this.timestamp)}) [${ConvertSecToFormat(trackDuration)}], requested by ${this.trackList[this.queuePos].requestedBy}.`;
                }
                const nextTracks = [''];
                for (let i = this.queuePos + 1, i2 = 0; i < this.trackList.length; i++) {
                    const trackDuration = this.trackList[i].duration;
                    const trackAppend = `\nTrack ${i + 1}: [${this.trackList[i].title}](${this.trackList[i].sourceLink}) [${ConvertSecToFormat(trackDuration)}], requested by ${this.trackList[i].requestedBy}.`;
                    if (nextTracks[i2].length + trackAppend.length < 1024)
                        nextTracks[i2] += trackAppend;
                    else {
                        i2++;
                        nextTracks.push(trackAppend);
                    }
                }
                const queueEmbeds = [new Discord.MessageEmbed()
                        .setColor('#0000ff')
                        .setTitle(`Queue [${this.queueDuration !== 0 ? ConvertSecToFormat(this.queueDuration) : ' no upcoming tracks '}]`)
                        .setDescription(`Looping: ${this.loopTrack ? 'Track' : this.loopQueue ? 'Queue' : 'Disabled'}`)];
                if ((_a = this.textChannel) === null || _a === void 0 ? void 0 : _a.client.user)
                    queueEmbeds[0].setAuthor('Bomborastclaat', this.textChannel.client.user.displayAvatarURL());
                let i2 = 0;
                if (pastTracks[0] !== '') {
                    for (let i = 0; i < pastTracks.length; i++) {
                        const fieldToAdd = { name: i === 0 ? `Past Track${this.queuePos > 1 ? 's' : ''}:` : 'continued...', value: pastTracks[i] };
                        const authorName = (_b = queueEmbeds[i2].author) === null || _b === void 0 ? void 0 : _b.name;
                        if (queueEmbeds[i2].length + (authorName ? authorName.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000)
                            queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
                        else {
                            queueEmbeds.push(new Discord.MessageEmbed().setColor('#0000ff'));
                            queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
                        }
                    }
                }
                if (currentTrack[0] !== '') {
                    const fieldToAdd = { name: 'Current Track:', value: currentTrack[0] };
                    const authorName = (_c = queueEmbeds[i2].author) === null || _c === void 0 ? void 0 : _c.name;
                    if (queueEmbeds[i2].length + (authorName ? authorName.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000)
                        queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
                    else {
                        queueEmbeds.push(new Discord.MessageEmbed().setColor('#0000ff'));
                        queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
                    }
                    queueEmbeds[i2].setThumbnail(this.trackList[this.queuePos].icon);
                }
                if (nextTracks[0] !== '') {
                    for (let i = 0; i < nextTracks.length; i++) {
                        const fieldToAdd = { name: i === 0 ? `Upcoming Track${this.queuePos < this.trackList.length - 2 ? 's' : ''}:` : 'continued...', value: nextTracks[i] };
                        const authorName = (_d = queueEmbeds[i2].author) === null || _d === void 0 ? void 0 : _d.name;
                        if (queueEmbeds[i2].length + (authorName ? authorName.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000)
                            queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
                        else {
                            queueEmbeds.push(new Discord.MessageEmbed().setColor('#0000ff'));
                            queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
                        }
                    }
                }
                return resolve(queueEmbeds);
            });
        });
    }
    /**
     * Skip the current track in the queue and start playing the next.
     * @returns A promise that resolves to a confirmation message
     */
    skip() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a, _b;
                if (this.trackList.length === 0 || this.queuePos > this.trackList.length - 1)
                    return resolve('No track to skip!');
                if (this.queuePos > this.trackList.length - 2) { // -2 becuase the last track is being played
                    if (!this.loopQueue) {
                        this.playing = false;
                        (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
                        this.subscription = undefined;
                        (_b = this.connection) === null || _b === void 0 ? void 0 : _b.disconnect();
                        this.queuePos++;
                        return resolve(`Skipping final track: ${this.trackList[this.queuePos - 1].title} and disconnecting.`);
                    }
                    else {
                        this.queuePos = 0;
                        this.play().then(msg => {
                            resolve(`Looping the queue!\n${msg}`);
                        }, err => {
                            reject(err);
                        });
                    }
                }
                else {
                    this.queuePos++;
                    this.play().then(msg => {
                        resolve(`Skipping ${this.trackList[this.queuePos - 1].title}.\n${msg}`);
                    }, err => {
                        reject(err);
                    });
                }
            });
        });
    }
    /**
     * Shuffle the upcoming tracks.
     */
    shuffle() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const upcomingTracks = this.trackList.slice(this.queuePos);
                for (let currentIndex = upcomingTracks.length; currentIndex > 0;) {
                    const randomIndex = Math.floor(Math.random() * currentIndex--);
                    const tempValue = upcomingTracks[currentIndex];
                    upcomingTracks[currentIndex] = upcomingTracks[randomIndex];
                    upcomingTracks[randomIndex] = tempValue;
                }
                for (let i = 0; i < upcomingTracks.length + 1; i++)
                    this.trackList[this.trackList.length - i] = upcomingTracks[upcomingTracks.length - i];
                resolve(`Shuffled ${upcomingTracks.length} tracks!`);
            });
        });
    }
    /**
     * Stop the queue and disconnect from the voice channel.
     */
    disconnect() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.trackAudioPlayer.pause();
            this.accentAudioPlayer.stop();
            (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            (_b = this.connection) === null || _b === void 0 ? void 0 : _b.disconnect();
        });
    }
    /**
     * Get the voice channel to which the client is connected, if any.
     */
    get activeVoiceChannel() {
        var _a;
        if ((_a = this.connection) === null || _a === void 0 ? void 0 : _a.joinConfig.channelId)
            return this.client.channels.fetch(this.connection.joinConfig.channelId);
        else
            return null;
    }
    /**
     * Get the current track
     */
    get currentTrack() {
        if (this.playing)
            return this.trackList[this.queuePos];
        else
            return null;
    }
    /**
     * Get the current timestamp.
     */
    get timestamp() {
        return Math.round((this.seekTime !== 0
            ? this.seekTime
            : this.trackList[this.queuePos].startOffset) +
            (this.trackAudioPlayer.state.status === Voice.AudioPlayerStatus.Playing && this.trackAudioResource
                ? (this.trackAudioResource.playbackDuration / 1000)
                : 0));
    }
    /**
     * Get the total duration of tracks left on the queue.
     */
    get queueDuration() {
        let duration = 0;
        for (let i = this.queuePos + 1; i < this.trackList.length; i++)
            duration += this.trackList[i].duration;
        duration += this.currentTrack ? this.currentTrack.duration - this.timestamp : 0;
        return duration;
    }
    /**
     * Pause the player.
     * @returns A promise with a confirmation message
     */
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                if (!this.playing)
                    return resolve('Cannot Pause: Nothing playing!');
                if (this.paused)
                    return resolve('Cannot Pause: Player is already paused!');
                this.paused = true;
                this.trackAudioPlayer.pause();
            });
        });
    }
    /**
     * Unpause the player.
     * @returns A promise with a confirmation message
     */
    unpause() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                if (!this.playing)
                    return resolve('Cannot Unpause: Nothing playing!');
                if (!this.paused)
                    return resolve('Cannot Unpause: Player is not paused!');
                this.paused = false;
                this.setVolume(this.volume);
                this.trackAudioPlayer.unpause();
            });
        });
    }
    /**
     * Set the volume of the player.
     * @param volumeAmount A number to set volume relative to a default value.
     */
    setVolume(volumeAmount) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // not sure how to implement now
            if (!((_a = this.trackAudioResource) === null || _a === void 0 ? void 0 : _a.volume))
                return;
            this.volume = volumeAmount;
            this.trackAudioResource.volume.setVolume(volumeAmount);
        });
    }
    /**
     * Set playback to a certain timestamp of the track.
     * @param seconds The number of seconds to seek to
     * @returns A promise which resolves to a confirmation message
     */
    seek(seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.playing)
                    reject(Error('Nothing playing!'));
                if (this.paused)
                    reject(Error('Player is paused!'));
                if (seconds < (this.trackList[this.queuePos].duration)) {
                    this.seekTime = seconds;
                    this.play(seconds, true);
                    return resolve();
                }
                else {
                    return resolve('Can\'t seek this far its too long bitch');
                }
            });
        });
    }
    /**
     * Remove a track at a given index from the queue.
     * @param index Index of track to remove from the queue
     * @returns A promise which resolves to a confirmation messsage
     */
    remove(index) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (isNaN(index))
                    return reject(Error('Expected a number!'));
                if (index >= this.trackList.length)
                    return reject(Error('Cannot remove: index out of range!'));
                index = Math.floor(index);
                const removedTrack = this.trackList[index];
                this.trackList.splice(index, 1);
                if (this.queuePos > index)
                    this.queuePos--;
                return resolve(`Removed Track ${index + 1}: ${removedTrack.title} [${ConvertSecToFormat(removedTrack.duration)}]`);
            });
        });
    }
    /**
     * Move a track from one position in the queue to an other.
     * @param index1 Origin of track move
     * @param index2 Destination of track move
     * @returns A promise which resolves to a confirmation message
     */
    move(index1, index2) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (index1 >= this.trackList.length || index2 >= this.trackList.length)
                    return reject(Error('Cannot move: At least one of indices is out of range!'));
                [this.trackList[index1], this.trackList[index2]] = [this.trackList[index2], this.trackList[index1]];
                if (index2 === this.queuePos) {
                    this.play().then(msg => {
                        resolve(`Moving track ${index1 + 1} to position ${index2 + 1}\n${msg}`);
                    }, err => {
                        reject(err);
                    });
                }
                else {
                    resolve(`Moving track ${index1 + 1} to position ${index2 + 1}`);
                }
            });
        });
    }
    /**
     * Clear all contents of the queue, apart from current track.
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentTrack)
                this.trackList = [this.currentTrack];
            else
                this.trackList = [];
            this.queuePos = 0;
        });
    }
    /**
     * Get information for the track at a given index.
     * @param pos The position of the track for which to retrieve information
     * @returns A promise which resolves to the embeds containing the information
     */
    infoEmbed(pos = this.queuePos) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (pos >= this.trackList.length)
                    return reject(Error('Track number out of range!'));
                const PROGRESS_BAR_LENGTH = 25;
                const timestampLitteral = pos === this.queuePos ? `&t=${Math.floor(this.timestamp)}` : '';
                const infoEmbed = new Discord.MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('Track Information')
                    .addField('Track Title', `[${this.trackList[pos].title}](${this.trackList[pos].sourceLink}${timestampLitteral}) [${ConvertSecToFormat(this.trackList[pos].duration)}]`);
                try {
                    if (pos === this.queuePos && this.currentTrack) {
                        let progressBar = '>';
                        let i = 0;
                        for (; i < Math.round((this.timestamp / (this.currentTrack.duration)) * PROGRESS_BAR_LENGTH); i++) { // if pos is queuepos there is a current track
                            progressBar += '█';
                        }
                        for (; i < PROGRESS_BAR_LENGTH; i++) {
                            progressBar += '░';
                        }
                        progressBar += '<';
                        infoEmbed.addField('Track Progress', `${progressBar} \u0009 [${ConvertSecToFormat(Math.round(this.timestamp))} / ${ConvertSecToFormat(this.currentTrack.duration)}]`);
                    }
                    else if (pos > this.queuePos && this.currentTrack) {
                        let cumulativeSeconds = 0;
                        for (let i = 1; i < pos - this.queuePos; i++)
                            cumulativeSeconds += this.trackList[pos + i].duration;
                        infoEmbed.addField('Time to Play', `${ConvertSecToFormat((this.currentTrack.duration) - this.timestamp + cumulativeSeconds)}`);
                    }
                    infoEmbed.addFields([{ name: 'Author', value: this.trackList[pos].author },
                        { name: 'Requested by:', value: this.trackList[pos].requestedBy.user.tag }])
                        .setImage(this.trackList[pos].icon)
                        .setTimestamp();
                    return resolve(infoEmbed);
                }
                catch (err) {
                    if (err instanceof Error) {
                        err.message = `WARNING: Cannot send embed: ${err.message}`;
                        (0, log_1.logError)(err);
                    }
                    else
                        (0, log_1.logError)(Error('WARNING: Logging non-error typed error!'));
                    return reject(err);
                }
            });
        });
    }
    /**
     * Toggle track looping
     */
    toggleTrackLoop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.loopTrack = !this.loopTrack;
        });
    }
    /**
     * Toggle queue looping
     */
    toggleQueueLoop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.loopQueue = !this.loopQueue;
        });
    }
    /**
     * Queue an accent (text to speech) action.
     * @param language Language with which to read the text to speech message
     * @param text The text to read out
     * @returns A promise that resolves once accents are finished playing
     */
    queueAccent(language, text) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                if (!this.languages.includes(language)) {
                    language = 'es';
                    text = 'That\'s not a language fucktard!';
                }
                if (DISABLE_ACCENT_QUEUE)
                    this.accentList = [];
                if (text.length > 200) {
                    const numIter = Math.ceil(text.length / 200); // ensure correct iteration of for loop
                    for (let i = 0; i < numIter; i++) {
                        for (let i2 = 200; i2 > 0; i2--) {
                            if (text[i2] === ' ') {
                                this.accentList.push({ language: language, text: text.slice(0, i2) });
                                text = text.slice(i2 + 1); // remove the extra space
                                break;
                            }
                            if (i2 === 1) {
                                this.accentList.push({ language: language, text: text.slice(0, 199) });
                                text = text.slice(199);
                            }
                        }
                    }
                }
                this.accentList.push({ language: language, text: text });
                this.playAccents().then(() => {
                    return resolve();
                }, err => {
                    err.message = `WARNING: Cannot play accent! ${err.message}`;
                    (0, log_1.logError)(err);
                });
            });
        });
    }
    /**
     * Play accents in the accents queue.
     * @returns A void promise
     */
    playAccents() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.voiceChannel)
                return Promise.reject(Error('Queue must be bound to a voice channel to play acccents!'));
            if (!this.playingAccent)
                this.stopTimestamp = null;
            if (this.accentTimeoutId) {
                clearTimeout(this.accentTimeoutId);
                this.accentTimeoutId = undefined;
            }
            if (this.trackAudioPlayer && this.trackAudioPlayer.state.status !== Voice.AudioPlayerStatus.Paused && this.playing) {
                this.stopTimestamp = this.timestamp;
                this.trackAudioPlayer.pause();
            }
            try {
                this.connection = yield connectVoice(this.voiceChannel).catch(err => Promise.reject(err));
            }
            catch (err) {
                return Promise.reject(err);
            }
            return new Promise((resolve, reject) => {
                var _a;
                this.playingAccent = true;
                this.subscription = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.subscribe(this.accentAudioPlayer);
                this.accentAudioPlayer.play(Voice.createAudioResource(getTTSLink(this.accentList[0].language, this.accentList[0].text)));
                this.accentAudioPlayer
                    .on('stateChange', (oldState, newState) => {
                    if (oldState.status === Voice.AudioPlayerStatus.Playing && newState.status === Voice.AudioPlayerStatus.Idle) {
                        this.accentList.splice(0, 1);
                        if (this.accentList.length === 0) {
                            this.playingAccent = false;
                            if (this.stopTimestamp) {
                                this.play().then(() => {
                                    var _a;
                                    this.seek((_a = this.stopTimestamp) !== null && _a !== void 0 ? _a : 0);
                                }).catch(err => {
                                    err.message = `WARNING: Cannot resume track after accent! ${err.message}`;
                                    (0, log_1.logError)(err);
                                });
                            }
                            else {
                                this.accentTimeoutId = setTimeout(() => {
                                    var _a;
                                    this.accentAudioPlayer.stop();
                                    (_a = this.connection) === null || _a === void 0 ? void 0 : _a.disconnect();
                                    this.connection = null;
                                }, 30 * 1000).unref();
                            }
                            return resolve();
                        }
                        this.playAccents().catch(err => {
                            err.message = `Cannot play accent! ${err.message}`;
                            return reject(err);
                        });
                    }
                })
                    .on('error', (err) => {
                    err.message = `WARNING: Cannot play accent! ${err.message}`;
                    (0, log_1.logError)(err);
                    this.accentList.splice(0, 1);
                });
            });
        });
    }
    /**
     * Delete all connections, close all players, then delete queue for this guild.
     */
    clean() {
        var _a, _b;
        this.trackAudioPlayer.stop();
        (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        this.accentAudioPlayer.stop();
        (_b = this.connection) === null || _b === void 0 ? void 0 : _b.destroy();
        // this.connection = null;
        exports.queueMap.delete(this.guildId);
    }
}
exports.Queue = Queue;
exports.queueMap = new Map();
//# sourceMappingURL=audio.js.map