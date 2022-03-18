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
exports.module = {
    name: 'loop',
    aliases: ['l', 'replay', 'again'],
    description: 'Toggle between no loop, track loop and queue loop',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            if (!currentQueue.loopTrack && !currentQueue.loopQueue) {
                currentQueue.toggleTrackLoop();
                message.channel.send('Now looping this track!');
            }
            else if (currentQueue.loopTrack) {
                currentQueue.toggleTrackLoop();
                currentQueue.toggleQueueLoop();
                message.channel.send('Now looping the queue!');
            }
            else {
                currentQueue.toggleQueueLoop();
                message.channel.send('Looping disabled!');
            }
        });
    }
};
//# sourceMappingURL=loop.js.map