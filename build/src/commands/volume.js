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
const DEFAULT_VOLUME = 0.15;
exports.module = {
    name: 'volume',
    aliases: ['v', 'vol'],
    description: 'earrape',
    args: 1,
    usage: '<volume level>',
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            // if (Number(args[0]) !== parseFloat(args[0])) return message.channel.send('Please provide a number!');
            if (isNaN(parseFloat(args[0]))) {
                message.channel.send('Pleave provide a number!');
                return;
            }
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            try {
                yield currentQueue.setVolume(parseFloat(args[0]) * DEFAULT_VOLUME);
                message.channel.send(`Changed the volume to ${args[0]}.`);
                return;
            }
            catch (err) {
                if (err instanceof Error) {
                    err.message = `What u trying to change the volume of idiot? ${err.message}`;
                    (0, log_1.logError)(err);
                }
                else
                    (0, log_1.logError)(Error('WARNING: Logging non-error typed error!'));
            }
        });
    }
};
//# sourceMappingURL=volume.js.map