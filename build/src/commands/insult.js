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
const fs_1 = require("fs");
const log_1 = require("../log");
exports.module = {
    name: 'insult',
    description: 'Provide the user with a searing insult.',
    args: null,
    usage: null,
    dmCompatible: true,
    voiceConnection: false,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            let insults;
            (0, fs_1.readFile)('../slurs.txt', 'utf8', (err, data) => {
                if (err) {
                    (0, log_1.log)('"slurs.txt" could not be read or does not exist. Using default insults.');
                    insults = ['you burnt piece of celery.', 'you cunt.', 'you SIMP.', 'you Smol BRaIn.', 'you idiot sandwich.', 'you GAB!'];
                }
                else {
                    insults = data.split('\n');
                }
                message.channel.send(`Fuck you, ${message.author.username}, ${insults[Math.floor(Math.random() * insults.length)]}`);
            });
        });
    }
};
//# sourceMappingURL=insult.js.map