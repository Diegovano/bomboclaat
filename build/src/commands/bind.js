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
const discord_js_1 = require("discord.js");
const audio_1 = require("../audio");
exports.module = {
    name: 'bind',
    description: 'Bind the bot to this text channel.',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: false,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild || !message.client.user)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            message.guild.members.fetch(message.client.user.id).then(member => {
                if (!message.guild || !(message.channel instanceof discord_js_1.TextChannel))
                    return;
                if (message.channel.permissionsFor(member).has('SEND_MESSAGES'))
                    currentQueue.textChannel = message.channel;
                else
                    message.author.send(`Could not bind bot to ${message.channel.name} in server ${message.guild.name}! Insufficient permissions!`);
            }, err => {
                throw err;
            });
        });
    }
};
//# sourceMappingURL=bind.js.map