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
exports.module = {
    name: 'pp',
    aliases: ['dick', 'penis', 'hector'],
    description: 'Reveals the true size of people\'s ╭∩╮',
    args: null,
    usage: null,
    dmCompatible: true,
    voiceConnection: false,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.author.username === 'Terminator00702' || message.author.username === 'Bobnotarobot') {
                message.channel.send(`${message.author.username}'s cock size is:\n8¬ 1 inch! WOW`);
                return;
            }
            const penis = ['8'];
            let iter = 0;
            for (; iter < Math.floor(Math.random() * 50); iter++)
                penis.push('=');
            message.channel.send(`${message.author.username}'s cock size is:\n${penis.toString().replace(/,/gi, '')}D    ${iter} inches!`);
        });
    }
};
//# sourceMappingURL=pp.js.map