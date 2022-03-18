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
    name: 'seek',
    description: 'Seeks innit',
    args: 1,
    usage: '<seek value>',
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            // if (args[0].includes(`+`) || args[0].includes(`f`)) return currentQueue.seek(args[0].replace(/[+f]/g, ``), true);
            // if (args[0].includes(`-`) || args[0].includes(`b`)) return currentQueue.seek(-args[0].replace(/[-b]/g, ``), true);
            const seekVal = parseInt(args[0]);
            if (isNaN(seekVal))
                message.channel.send('Input must be a number!');
            currentQueue.seek(seekVal);
        });
    }
};
//# sourceMappingURL=seek.js.map