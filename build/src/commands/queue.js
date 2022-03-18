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
    name: 'queue',
    aliases: ['q', 'list', 'next', 'playlist'],
    description: 'Print a list of the track added to the queue since the bot joined the voice channel.',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: false,
    textBound: true,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            (0, audio_1.getQueue)(message.guild).getQueueMessage().then(messageContent => {
                if (typeof messageContent === 'string')
                    return message.channel.send(messageContent);
                message.channel.send({ embeds: messageContent }).catch(err => {
                    message.channel.send('Unable to send queue message');
                    err.message = `WARNING: Cannot send queue embeds! ${err.message}`;
                    (0, log_1.logError)(err);
                });
            }, err => {
                message.channel.send('Unable to get queue message');
                err.message = `WARNING: Cannot get queue message! ${err.message}`;
                (0, log_1.logError)(err);
            });
        });
    }
};
//# sourceMappingURL=queue.js.map