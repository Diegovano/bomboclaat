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
    name: 'accent',
    aliases: ['a'],
    description: 'Fuck diegos descriptions',
    args: 2,
    usage: '<language> <text>',
    dmCompatible: false,
    voiceConnection: true,
    textBound: false,
    execute(message, args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild)
                return;
            const currentQueue = (0, audio_1.getQueue)(message.guild);
            currentQueue.voiceChannel = (_b = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel) !== null && _b !== void 0 ? _b : null;
            const languages = ['french', 'german', 'russian', 'japanese', 'chinese', 'english', 'arabic', 'italian', 'spanish', 'korean', 'portuguese', 'swedish', 'dutch', 'nz', 'aussie', 'quebec', 'indian', 'american', 'welsh'];
            let lang;
            args[0] = args[0].toLowerCase();
            switch (args[0]) {
                case languages[0]:
                    lang = 'fr';
                    break;
                case languages[1]:
                    lang = 'de';
                    break;
                case languages[2]:
                    lang = 'ru';
                    break;
                case languages[3]:
                    lang = 'ja';
                    break;
                case languages[4]:
                    lang = 'zh';
                    break;
                case languages[5]:
                    lang = 'en';
                    break;
                case languages[6]:
                    lang = 'ar';
                    break;
                case languages[7]:
                    lang = 'it';
                    break;
                case languages[8]:
                    lang = 'es';
                    break;
                case languages[9]:
                    lang = 'ko';
                    break;
                case languages[10]:
                    lang = 'pt';
                    break;
                case languages[11]:
                    lang = 'sw';
                    break;
                case languages[12]:
                    lang = 'nl';
                    break;
                case languages[13]:
                    lang = 'en_nz';
                    break;
                case languages[14]:
                    lang = 'en_au';
                    break;
                case languages[15]:
                    lang = 'fr_ca';
                    break;
                case languages[16]:
                    lang = 'hi';
                    break;
                case languages[17]:
                    lang = 'en_us';
                    break;
                default:
                    lang = args[0];
            }
            currentQueue.queueAccent(lang, args.splice(1).join(' '));
        });
    }
};
//# sourceMappingURL=accent.js.map