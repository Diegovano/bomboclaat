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
    name: 'bg',
    description: 'Self encouragement!',
    args: null,
    usage: null,
    dmCompatible: true,
    voiceConnection: false,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (message.author.id) {
                case '620196939572576258':
                    message.channel.send('We don\'t care about your opinion Hugo.');
                    break; // PBS
                case '244920561443012608':
                    message.channel.send('En effet, c\'est toi le moins beau du monde entier');
                    break; // Hectah
                case '795261511647100968':
                    message.channel.send('Puta Troya de Mierda');
                    break; // Gab
                case '578050897092018196':
                    message.channel.send('poooooop');
                    break; // Remy
                case '410174833154850816':
                    message.channel.send('t pas cool mais la Picardie ce l\'est');
                    break; // Clovis
                default: message.channel.send('Decidément.');
            }
        });
    }
};
//# sourceMappingURL=bg.js.map