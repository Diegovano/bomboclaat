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
exports.getTrackObjects = exports.module = void 0;
const Discord = __importStar(require("discord.js"));
const fs_1 = require("fs");
const googleapis_1 = require("googleapis");
const audio_1 = require("../audio");
const log_1 = require("../log");
const types_1 = require("../types");
const youtube = googleapis_1.google.youtube('v3');
exports.module = {
    name: 'play',
    aliases: ['p'],
    description: 'If paused, unpause, otherwise add track to queue.',
    args: null,
    usage: '[track name]',
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            currentQueue.voiceChannel = (_b = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel) !== null && _b !== void 0 ? _b : null;
            if (!args[0]) {
                try {
                    currentQueue.unpause();
                }
                catch (error) {
                    message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
                }
                return;
            }
            getTrackObjects(message, args).then(function addTracksToQueue(tracks) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (tracks.length === 1) {
                        currentQueue.add(tracks[0], false, false).then(msg => {
                            if (msg)
                                message.channel.send(msg);
                        }, err => {
                            err.message = `WARNING: Cannot add track to queue! ${err.message}`;
                            (0, log_1.logError)(err);
                            message.channel.send('Cannot add track to queue!');
                        });
                    }
                    else if (tracks.length > 1) {
                        message.channel.send(`Adding ${tracks.length} tracks to the queue!`);
                        for (let i = 0; i < tracks.length; i++) {
                            yield currentQueue.add(tracks[i], true, false).then(msg => {
                                if (msg)
                                    message.channel.send(msg);
                            }, err => {
                                err.message = `WARNING: Cannot add track to playlist! ${err.message}`;
                                (0, log_1.logError)(err);
                                message.channel.send('Cannot add track to playlist!');
                            });
                        }
                    }
                    else {
                        message.channel.send('No tracks added!'); // if no tracks returned i.e. no search results
                    }
                });
            }, err => {
                err.message = `WARNING: Unable to get track information! ${err.message}`;
                (0, log_1.logError)(err);
                message.channel.send('Unable to add track to queue!');
            });
        });
    }
};
function getTrackObjects(message, searchTerm) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const tracksToAdd = [];
            const videoIdMatch = searchTerm[0].match(/(?:youtu)(?:.*?)(?:^|\/|v=)([a-z0-9_-]{11})(?:.*)/i);
            const timestampMatch = searchTerm[0].match(/(?:[?&]t=)(.*?)(?:&|$)/i);
            const playlistIdMatch = searchTerm[0].match(/(?<=[&?]list=)(.*?)(?=(&|$))/i);
            if (videoIdMatch) {
                const videoId = videoIdMatch[1];
                let timestamp;
                if (searchTerm[0].match(/[?&]t=/i)) {
                    if (timestampMatch) {
                        const timestampMatchString = timestampMatch[1];
                        let seconds = 0;
                        if (timestampMatchString.includes('h')) {
                            let i = 0;
                            while (timestampMatchString[i] !== 'h')
                                i++;
                            for (let i2 = 0; i2 < i; i2++) {
                                seconds += parseInt(timestampMatchString[i - i2 - 1]) * Math.pow(10, (i2)) * 3600;
                            }
                            try {
                                timestampMatchString[0].substr(i);
                            }
                            catch (error) {
                                reject(error);
                            }
                        }
                        if (timestampMatchString.includes('m')) {
                            let i = 0;
                            while (timestampMatchString[i] !== 'h')
                                i++;
                            for (let i2 = 0; i2 < i; i2++) {
                                seconds += parseInt(timestampMatchString[i - i2 - 1]) * Math.pow(10, (i2)) * 60;
                            }
                            try {
                                timestampMatchString[0].substr(i);
                            }
                            catch (error) {
                                reject(error);
                            }
                        }
                        if (timestampMatchString.includes('s')) {
                            let i = 0;
                            while (timestampMatchString[i] !== 's')
                                i++;
                            for (let i2 = 0; i2 < i; i2++) {
                                seconds += parseInt(timestampMatchString[i - i2 - 1]) * Math.pow(10, (i2));
                            }
                        }
                        if (!timestampMatchString.includes('h') && !timestampMatchString.includes('m') && !timestampMatchString.includes('s')) {
                            for (let i = 0; i < timestampMatchString.length; i++) {
                                seconds += parseInt(timestampMatchString[timestampMatchString.length - i - 1]) * Math.pow(10, (i));
                            }
                        }
                        timestamp = timestampMatchString ? seconds : 0;
                    }
                }
                let ytkey;
                if (!process.env.YTTOKEN) { // Check if running github actions or just locally
                    try {
                        ytkey = (0, fs_1.readFileSync)('.yttoken', 'utf8');
                    }
                    catch (err) {
                        return reject(Error('Cannot read YouTube key!'));
                    }
                }
                else {
                    ytkey = process.env.YTTOKEN;
                }
                const opts = {
                    part: ['snippet', 'contentDetails'],
                    id: [videoId],
                    key: ytkey
                };
                return youtube.videos.list(opts).then(res => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
                    if (!res.data.items)
                        return reject(Error('Unable to read video information!'));
                    if (!message.member)
                        return reject(Error('Seems like we are not in a guild...'));
                    const track = new audio_1.Track((_a = res.data.items[0].id) !== null && _a !== void 0 ? _a : 'invalid', (_c = (_b = res.data.items[0].snippet) === null || _b === void 0 ? void 0 : _b.channelTitle) !== null && _c !== void 0 ? _c : 'invalid', (_f = (_e = (_d = res.data.items[0].snippet) === null || _d === void 0 ? void 0 : _d.localized) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : 'invalid', (_j = (_h = (_g = res.data.items[0].snippet) === null || _g === void 0 ? void 0 : _g.localized) === null || _h === void 0 ? void 0 : _h.description) !== null && _j !== void 0 ? _j : 'invalid', (_o = (_m = (_l = (_k = res.data.items[0].snippet) === null || _k === void 0 ? void 0 : _k.thumbnails) === null || _l === void 0 ? void 0 : _l.high) === null || _m === void 0 ? void 0 : _m.url) !== null && _o !== void 0 ? _o : 'invalid', message.member, timestamp !== null && timestamp !== void 0 ? timestamp : 0, parseInt((_q = (_p = res.data.items[0].contentDetails) === null || _p === void 0 ? void 0 : _p.duration) !== null && _q !== void 0 ? _q : '0'));
                    tracksToAdd.push(track);
                    resolve(tracksToAdd);
                }, err => {
                    err.message = `Unable to get video information from link! ${err.message}`;
                    return reject(err);
                });
            }
            else if (playlistIdMatch) {
                const playlistId = playlistIdMatch[1];
                let ytkey;
                if (!process.env.YTTOKEN) { // Check if running github actions or just locally
                    try {
                        ytkey = (0, fs_1.readFileSync)('.yttoken', 'utf8');
                    }
                    catch (err) {
                        return reject(Error('Cannot read YouTube key!'));
                    }
                }
                else {
                    ytkey = process.env.YTTOKEN;
                }
                const nextPage = '';
                const MAX_TRACKS_PER_PLAYLIST = 100; // multiples of 50
                const opts = {
                    part: ['snippet', 'status'],
                    playlistId: playlistId,
                    maxResults: 50,
                    pageToken: nextPage,
                    key: ytkey
                };
                youtube.playlistItems.list(opts).then(function getPlaylistPageInfo(res) {
                    var _a;
                    return __awaiter(this, void 0, void 0, function* () {
                        if (!((_a = res.data.pageInfo) === null || _a === void 0 ? void 0 : _a.resultsPerPage) || !res.data.pageInfo.totalResults || !res.data.items)
                            return reject(Error('Unable to get playlist information from link!'));
                        for (let i = 0; i < MAX_TRACKS_PER_PLAYLIST / res.data.pageInfo.resultsPerPage && i < Math.ceil(res.data.pageInfo.totalResults / res.data.pageInfo.resultsPerPage); i++) {
                            yield youtube.playlistItems.list(opts).then(function getPlaylistTracks(res) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                                return __awaiter(this, void 0, void 0, function* () {
                                    if (!((_a = res.data.pageInfo) === null || _a === void 0 ? void 0 : _a.resultsPerPage) || !res.data.pageInfo.totalResults || !res.data.items || !message.member)
                                        return reject(Error('Unable to get playlist information from link!'));
                                    for (let i2 = 0; i2 < res.data.items.length; i2++) {
                                        if (((_b = res.data.items[i2].status) === null || _b === void 0 ? void 0 : _b.privacyStatus) === 'public' ||
                                            ((_c = res.data.items[i2].status) === null || _c === void 0 ? void 0 : _c.privacyStatus) === 'unlisted') {
                                            const track = new audio_1.Track((_f = (_e = (_d = res.data.items[i2].snippet) === null || _d === void 0 ? void 0 : _d.resourceId) === null || _e === void 0 ? void 0 : _e.videoId) !== null && _f !== void 0 ? _f : 'invalid', (_h = (_g = res.data.items[i2].snippet) === null || _g === void 0 ? void 0 : _g.channelTitle) !== null && _h !== void 0 ? _h : 'invalid', (_k = (_j = res.data.items[i2].snippet) === null || _j === void 0 ? void 0 : _j.title) !== null && _k !== void 0 ? _k : 'invalid', (_m = (_l = res.data.items[i2].snippet) === null || _l === void 0 ? void 0 : _l.description) !== null && _m !== void 0 ? _m : 'invalid', (_r = (_q = (_p = (_o = res.data.items[i2].snippet) === null || _o === void 0 ? void 0 : _o.thumbnails) === null || _p === void 0 ? void 0 : _p.high) === null || _q === void 0 ? void 0 : _q.url) !== null && _r !== void 0 ? _r : '', message.member, 0);
                                            tracksToAdd.push(track);
                                        }
                                    }
                                    if (res.data.nextPageToken)
                                        opts.pageToken = res.data.nextPageToken;
                                });
                            }, err => {
                                reject(err);
                            });
                        }
                        return resolve(tracksToAdd);
                    });
                }, err => {
                    err.message = `Unable to get playlist information from link! ${err.message}`;
                    reject(err);
                });
                // eslint-disable-next-line brace-style
            } /* else if (searchTerm[0].includes('spotify.com')) {
              getSpotifyMetadata(message, searchTerm).then(trackArray => { // is in array form
                resolve(trackArray);
              }, err => {
                reject(err);
              });
            } */
            else {
                ytSearch(searchTerm.join(' '), message).then(track => {
                    if (!track)
                        resolve([]);
                    else {
                        tracksToAdd.push(track);
                        resolve(tracksToAdd);
                    }
                }, err => {
                    reject(err);
                });
            }
        });
    });
}
exports.getTrackObjects = getTrackObjects;
function ytSearch(searchTerm, message) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let ytkey;
            if (!process.env.YTTOKEN) { // Check if running github actions or just locally
                try {
                    ytkey = (0, fs_1.readFileSync)('.yttoken', 'utf8');
                }
                catch (err) {
                    return reject(Error('SEVERE: Cannot read YouTube key!'));
                }
            }
            else {
                ytkey = process.env.YTTOKEN;
            }
            const opts = {
                q: searchTerm,
                part: ['snippet'],
                maxResults: 5,
                type: ['video'],
                key: ytkey
            };
            youtube.search.list(opts).then(res => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                if (!res.data.items || !message.member)
                    return;
                const resArr = [];
                for (let i = 0; i < res.data.items.length; i++) {
                    resArr.push(new audio_1.Track((_b = (_a = res.data.items[i].id) === null || _a === void 0 ? void 0 : _a.videoId) !== null && _b !== void 0 ? _b : 'invalid', (_d = (_c = res.data.items[i].snippet) === null || _c === void 0 ? void 0 : _c.channelTitle) !== null && _d !== void 0 ? _d : 'invalid', (_f = (_e = res.data.items[i].snippet) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : 'invalid', (_h = (_g = res.data.items[i].snippet) === null || _g === void 0 ? void 0 : _g.description) !== null && _h !== void 0 ? _h : 'invalid', (_m = (_l = (_k = (_j = res.data.items[i].snippet) === null || _j === void 0 ? void 0 : _j.thumbnails) === null || _k === void 0 ? void 0 : _k.high) === null || _l === void 0 ? void 0 : _l.url) !== null && _m !== void 0 ? _m : 'invalid', message.member, 0));
                }
                userSelect(resArr, message).then(res => {
                    resolve(res);
                }, err => {
                    reject(err);
                });
            }, reason => {
                (0, log_1.logError)(Error(`Unable to search using googleApis! ${reason}`));
            });
        });
    });
}
function userSelect(results, message) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (results.length === 0) {
                message.channel.send('No results for your search!');
                return resolve(null);
            }
            const reactionList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            if (results.length > reactionList.length) {
                (0, log_1.logError)(Error('WARNING: More results than reactions!'));
                results.length = reactionList.length;
            }
            const trackSelection = new Discord.MessageEmbed()
                .setTitle('Please make a selection: ')
                .setColor('#ff0000');
            for (let i = 0; i < results.length; i++) {
                trackSelection.addField(`${i + 1} - ${results[i].title},
            Channel: ${results[i].author}`, `https://www.youtube.com/watch?v=${results[i].videoId}`);
            }
            message.channel.send({ embeds: [trackSelection] }).then(function collectReaction(msg) {
                return __awaiter(this, void 0, void 0, function* () {
                    const reactionTime = 30 * 1000;
                    const waitTime = 5 * 1000;
                    const options = { max: 1, time: reactionTime };
                    const reactionPromiseList = [];
                    let embedDeleted = false;
                    let collected = false;
                    for (let i = 0; i < results.length && i < reactionList.length; i++) {
                        if (!embedDeleted) {
                            reactionPromiseList.push(msg.react(reactionList[i]).catch(reason => {
                                (0, log_1.logError)(Error(`WARNING: Unable to add reaction to embed! Has message been deleted? ${reason}`));
                                return Promise.resolve();
                            }));
                        }
                        // most likely error is that embed has already been deleted before all reactions are added. No action necessary.
                    }
                    const filters = [];
                    for (let i = 0; i < results.length && i < reactionList.length; i++) {
                        filters.push(Object.assign(Object.assign({}, options), { filter: (reaction, user) => reaction.emoji.name === reactionList[i] && user.id === message.author.id }));
                    }
                    const collectors = [];
                    for (let i = 0; i < results.length && i < reactionList.length; i++) {
                        collectors.push(msg.createReactionCollector(filters[i]));
                        collectors[i].on('collect', () => {
                            if (collected)
                                return;
                            collected = true;
                            const timer = (0, types_1.wait)(waitTime);
                            Promise.all([...reactionPromiseList, timer]).then(() => {
                                if (embedDeleted)
                                    return;
                                embedDeleted = true;
                                msg.delete();
                            }).catch(err => {
                                err.message = `WARNING: Cannot delete search result embed! ${err.message}`;
                                (0, log_1.logError)(err);
                                if (!msg.deleted)
                                    msg.delete();
                            });
                            resolve(results[i]);
                        });
                    }
                    setTimeout(() => {
                        if (!embedDeleted) {
                            embedDeleted = true;
                            msg.delete();
                        }
                    }, reactionTime).unref();
                });
            }, err => {
                reject(err);
            });
        });
    });
}
//# sourceMappingURL=play.js.map