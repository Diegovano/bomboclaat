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
const configFiles_1 = require("../configFiles");
const log_js_1 = require("../log.js");
exports.module = {
    name: 'togglebotchannel',
    description: 'Mark this channel as a bot channel, or vice-versa',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: false,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild || !(message.channel instanceof discord_js_1.TextChannel))
                return;
            const objectHandle = yield configFiles_1.config.get(message.guild);
            if (!objectHandle)
                throw Error('Guild not initialised!');
            // if (objectHandle.botChannels.findIndex(element => element.id === message.channel.id) === -1)
            if (!objectHandle.botChannels.get(message.channel.id)) {
                const botChannelObject = {
                    name: message.channel.name,
                    topic: message.channel.topic
                };
                objectHandle.botChannels.set(message.channel.id, botChannelObject);
                configFiles_1.config.writeToJSON().then(() => {
                    if (!message.guild || !(message.channel instanceof discord_js_1.TextChannel))
                        return;
                    message.channel.send(`${message.channel.name} added to bot channels!`);
                }, err => {
                    objectHandle.botChannels.delete(message.channel.id); // if unable to write reset
                    err.message = `WARNING: Unable to update config file! ${err.message}`;
                    (0, log_js_1.logError)(err);
                });
            }
            else {
                const backupObject = objectHandle.botChannels.get(message.channel.id);
                objectHandle.botChannels.delete(message.channel.id);
                configFiles_1.config.writeToJSON().then(() => {
                    if (!message.guild || !(message.channel instanceof discord_js_1.TextChannel))
                        return;
                    message.channel.send(`${message.channel.name} was removed as a bot channel!`);
                }, err => {
                    if (backupObject)
                        objectHandle.botChannels.set(message.channel.id, backupObject); // if unable to write reset
                    else
                        objectHandle.botChannels.delete(message.channel.id);
                    err.message = `WARNING: Unable to update config file! ${err.message}`;
                    (0, log_js_1.logError)(err);
                });
            }
        });
    }
};
//# sourceMappingURL=togglebotchannel.js.map