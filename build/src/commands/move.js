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
    name: 'move',
    description: 'Moves a track to a certain position in the queue',
    args: 2,
    usage: '<track position> <new position>',
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            const from = parseInt(args[0]);
            const to = parseInt(args[1]);
            if (isNaN(from) || isNaN(to))
                message.channel.send('Cannot move track! Arguments must be numbers.');
            currentQueue.move(from - 1, to - 1).then(msg => {
                if (msg)
                    message.channel.send(msg);
            }, err => {
                err.message = `WARNING: Cannot move tracks! ${err.message}`;
                (0, log_1.logError)(err);
                message.channel.send('Cannot move track!');
            });
        });
    }
};
//# sourceMappingURL=move.js.map