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
    name: 'remove',
    aliases: ['r'],
    description: 'Gets rid of a track in the queue',
    args: 1,
    usage: '<track position>',
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            currentQueue.remove(parseInt(args[0]) - 1).then(msg => {
                message.channel.send(msg);
            }, err => {
                message.channel.send(`Error removing track! ${err.message}`);
                // err.message = `WARNING: Error removing track ${err.message}`;
                // l.logError(err);
            });
        });
    }
};
//# sourceMappingURL=remove.js.map