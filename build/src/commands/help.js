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
const configFiles_1 = require("../configFiles");
const index_1 = require("../index");
exports.module = {
    name: 'help',
    aliases: ['h', 'commands', ''],
    description: 'List all commands or more info about a specific command.',
    args: null,
    usage: '[command name]',
    dmCompatible: true,
    voiceConnection: false,
    textBound: false,
    execute(message, args) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const commands = message.client.commands;
            let prefix;
            if (message.guild)
                prefix = (_b = (_a = (yield configFiles_1.config.get(message.guild))) === null || _a === void 0 ? void 0 : _a.prefix) !== null && _b !== void 0 ? _b : index_1.DEFAULT_PREFIX;
            prefix !== null && prefix !== void 0 ? prefix : (prefix = index_1.DEFAULT_PREFIX);
            if (!args.length) { // Show help for all commands
                const helpEmbed = new Discord.MessageEmbed()
                    .setTitle('Here\'s a list of all commands:')
                    .addField(commands.map((cmd) => cmd.name).join('\n'), `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);
                message.channel.send({ embeds: [helpEmbed] }); // split true means that should the message be too long, it will be cut into multiple messages.
            }
            else {
                const name = args[0].toLowerCase();
                const command = commands.get(name) || commands.find((cmd) => { var _a; return (_a = (cmd.aliases && cmd.aliases.includes(name))) !== null && _a !== void 0 ? _a : false; });
                if (!command) {
                    message.reply('That\'s not a valid command!');
                    return;
                }
                const helpEmbed = new Discord.MessageEmbed()
                    .setTitle(`NAME:\n${command.name}`)
                    .setColor(0xF1C40F)
                    .setThumbnail((_d = (_c = message.client.user) === null || _c === void 0 ? void 0 : _c.displayAvatarURL()) !== null && _d !== void 0 ? _d : '');
                if (command.aliases)
                    helpEmbed.addField('ALIASES:', `${command.aliases.join(', ')}`);
                if (command.description)
                    helpEmbed.addField('DESCRIPTION:', `${command.description}`);
                if (command.usage)
                    helpEmbed.addField('USAGE:', `\`${prefix}${command.name} ${command.usage}\``);
                message.channel.send({ embeds: [helpEmbed] });
            }
        });
    }
};
//# sourceMappingURL=help.js.map