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
    name: 'trackinfo',
    description: 'Show info about a track in the queue',
    aliases: ['info', 'songinfo'],
    args: null,
    usage: '[track number]',
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            currentQueue.infoEmbed(args[0] ? (!isNaN(parseInt(args[0])) ? parseInt(args[0]) - 1 : currentQueue.queuePos) : currentQueue.queuePos).then(embed => {
                var _a, _b, _c;
                if (!embed)
                    return;
                message.channel.send({ embeds: [embed.setAuthor('Bomborastaclaat', (_c = (_b = (_a = message.client) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.displayAvatarURL()) !== null && _c !== void 0 ? _c : '')] })
                    .catch(error => {
                    error.message = `WARNING: Could not send information embed! ${error.message}`;
                    (0, log_1.logError)(error);
                });
            }, err => {
                (0, log_1.log)(`Could not find track info! ${err.message}`);
                message.reply('error finding track information! Is value in range?');
            });
        });
    }
};
//# sourceMappingURL=songinfo.js.map