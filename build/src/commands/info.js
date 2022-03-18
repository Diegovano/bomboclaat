'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const Discord = __importStar(require("discord.js"));
exports.module = {
    name: 'personinfo',
    aliases: ['person', 'pinfo'],
    description: 'Gives critical information about the person.',
    args: null,
    usage: null,
    dmCompatible: true,
    voiceConnection: false,
    textBound: false,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            let sexuality = 'Straight';
            switch (message.author.username) {
                case 'Powered By Salt':
                    sexuality = 'curvy';
                    break;
                case 'Terminator00702':
                    sexuality = 'poof';
                    break;
                case 'Gabriele':
                    sexuality = 'oMnisexual';
                    break;
                case 'Jacko':
                    sexuality = 'Penguin';
                    break;
                case 'Jesus du 89':
                    sexuality = 'Dragon';
                    break;
                case 'bowser from sonic':
                    sexuality = 'gay bombocraasclaat';
                    break;
            }
            const embed = new Discord.MessageEmbed()
                .setTitle('User Info')
                .addField('Playername', message.author.username)
                .addField('Sexuality', sexuality)
                .setColor(0xF1C40F)
                .setThumbnail(message.author.displayAvatarURL());
            if (message.guild)
                embed.addField('Your favourite server is:', message.guild.name);
            message.channel.send({ embeds: [embed] });
        });
    }
};
//# sourceMappingURL=info.js.map