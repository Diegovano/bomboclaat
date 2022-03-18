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
    name: 'leave',
    aliases: ['quit', 'bye'],
    description: 'Tells the bot to disconnect from the voice channel.',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild || !message.member)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            const queueVoiceChannel = yield currentQueue.activeVoiceChannel;
            const userVoiceChannel = message.member.voice.channel;
            // If the bot isn't in a voiceChannel, don't execute any other code
            if (!queueVoiceChannel)
                return;
            // Compare the voiceChannels
            if (userVoiceChannel === queueVoiceChannel) {
                currentQueue.disconnect();
            }
            else {
                message.reply('Connect to the same voice channel as me to get me to leave!');
            }
        });
    }
};
//# sourceMappingURL=leave.js.map