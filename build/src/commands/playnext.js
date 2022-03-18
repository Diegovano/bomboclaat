'use strict';
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
exports.module = void 0;
const audio_1 = require("../audio");
const play_1 = require("./play");
const log_1 = require("../log");
exports.module = {
    name: 'playnext',
    aliases: ['pn', 'next'],
    description: 'Add a track to the queue that will play after the current one.',
    args: 1,
    usage: '<track name>',
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
            (0, play_1.getTrackObjects)(message, args).then((tracks) => __awaiter(this, void 0, void 0, function* () {
                if (tracks.length === 1) {
                    currentQueue.add(tracks[0], false, true).then(msg => {
                        if (msg)
                            message.channel.send(msg);
                    }, err => {
                        err.message = `WARNING: Cannot add track to queue! ${err.message}`;
                        (0, log_1.logError)(err);
                        message.channel.send('Cannot add track to queue!');
                    });
                }
                else {
                    message.channel.send(`Adding ${tracks.length} tracks to the queue!`);
                    for (let i = 0; i < tracks.length; i++) {
                        yield currentQueue.add(tracks[i], true, true).then(msg => {
                            if (msg)
                                message.channel.send(msg);
                        }, err => {
                            message.channel.send(err.message);
                        });
                    }
                }
            }), err => {
                err.message = `WARNING: Unable to get track information! ${err.message}`;
                (0, log_1.logError)(err);
            });
        });
    }
};
//# sourceMappingURL=playnext.js.map