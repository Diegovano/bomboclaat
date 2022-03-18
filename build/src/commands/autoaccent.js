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
const configFiles_1 = require("../configFiles");
const log_1 = require("../log");
exports.module = {
    name: 'autoaccent',
    aliases: ['aa'],
    description: 'Toggle auto-accent mode',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: true,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const objectHandle = yield configFiles_1.config.get(message.guild);
            if (!objectHandle)
                throw Error('bomboModule autoAccent: guild config not initialised!');
            objectHandle.autoAccent = !objectHandle.autoAccent;
            configFiles_1.config.writeToJSON().then(() => {
                message.channel.send(`${objectHandle.autoAccent ? 'Enabled' : 'Disabled'} auto-accent!`);
            }, err => {
                objectHandle.autoAccent = !objectHandle.autoAccent; // reset to previous
                err.message = `WARNING: Unable to update config file! ${err.message}`;
                (0, log_1.logError)(err);
            });
        });
    }
};
//# sourceMappingURL=autoaccent.js.map