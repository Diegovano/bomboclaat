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
const log_1 = require("../log");
exports.module = {
    name: 'join',
    aliases: ['j', 'hello', 'hi'],
    description: 'Tell the bot to join your voice channel.',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, _args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild || !((_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel))
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            currentQueue.setVoiceChannel(message.member.voice.channel).catch(err => {
                err.message = `WARNING: Cannot join voice channel! ${err.message}`;
                (0, log_1.logError)(err);
            });
        });
    }
};
//# sourceMappingURL=join.js.map