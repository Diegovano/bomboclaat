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
    name: 'switch',
    description: 'The bot will join the voice channel of the requestor.',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: true,
    textBound: false,
    execute(message, _args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            currentQueue.voiceChannel = (_b = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel) !== null && _b !== void 0 ? _b : null;
            if (currentQueue.currentTrack)
                currentQueue.play(currentQueue.timestamp);
        });
    }
};
//# sourceMappingURL=switch.js.map