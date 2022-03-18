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
exports.DEFAULT_PREFIX = void 0;
const Discord = __importStar(require("discord.js"));
const audio_1 = require("./audio");
const fs_1 = require("fs");
const path_1 = require("path");
const configFiles_1 = require("./configFiles");
const log_1 = require("./log");
const types_1 = require("./types");
exports.DEFAULT_PREFIX = 'v3'; /////////// DEBUG VALUE
let exiting = false;
const NODE_REQ_MAJ = 16;
const NODE_REQ_MIN = 6;
/**
 * Ensure environement is running correct version of Node.JS for discord.js.
 */
if (parseInt(process.versions.node.split('.')[0]) < NODE_REQ_MAJ || parseInt(process.versions.node.split('.')[1]) < NODE_REQ_MIN) {
    (0, log_1.logError)(Error(`Use Node.js version v${NODE_REQ_MAJ}.${NODE_REQ_MIN}.0 or greater! You are running ${process.version}.`));
    exitHandler(-1);
}
else
    (0, log_1.log)(`You're running Node.js ${process.version}`);
/**
 * Extends base Discord Client clas by adding commands Collection. This allows all commands to be accessed .through the client.
 * @extends Discord.Client
 */
class Client extends Discord.Client {
    constructor(ClientOptions) {
        super(ClientOptions);
        this.commands = new Discord.Collection();
    }
}
const client = new Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES]
    // disableMentions: 'all',
    // messageCacheLifetime: 120,
    // messageSweepInterval: 60
});
let token;
if (process.env.TOKEN) {
    token = process.env.TOKEN;
}
else {
    try {
        token = (0, fs_1.readFileSync)(`${(0, path_1.join)(process.cwd(), '.token')}`, 'utf8');
    }
    catch (err) {
        (0, log_1.logError)(Error('FATAL: Cannot read token'));
        exitHandler(-1);
    }
}
// Add commands to collection
const commandFiles = (0, fs_1.readdirSync)(`${(0, path_1.join)(process.cwd(), 'build', 'src', 'commands')}`).filter(file => (0, path_1.extname)(file) === '.js');
for (const file of commandFiles) {
    // const command = require(`${join(process.cwd(), 'src', 'commands', file)}`);
    Promise.resolve().then(() => __importStar(require(`${(0, path_1.join)(process.cwd(), 'build', 'src', 'commands', file)}`))).then((command) => {
        client.commands.set(command.module.name, command.module);
    }, err => {
        err.message = `WARNING: Could not load ${file}! ${err.message}`;
        (0, log_1.logError)(err);
    });
}
function initialiseGuildConfig(guildConfig, message) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (!guildConfig)
                return resolve({ guildConfig: null, msg: null });
            configFiles_1.config.accentUser(message, 'none', false).then(msg => {
                return resolve({ guildConfig: guildConfig, msg: msg });
            }, err => {
                return reject(err);
            });
        });
    });
}
client.once('ready', () => (0, log_1.log)('Ready!'));
// @ts-expect-error yes, discord message class does not have commands but we have added them. Message type will have commands property!
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (message.author.bot)
        return;
    let isCommand = false;
    const guild = message.guild;
    const member = message.member;
    let guildConf = null;
    if (message.channel.type !== 'GUILD_TEXT' || !guild || !member) {
        if (!message.content.startsWith(exports.DEFAULT_PREFIX))
            return;
    }
    else {
        guildConf = (_a = yield configFiles_1.config.get(guild) // setup guild in config file
            .then((guildConfig) => __awaiter(void 0, void 0, void 0, function* () { return initialiseGuildConfig(guildConfig, message); }), err => {
            err.message = `WARNING: Unable to read guildConfig but attempting to continue! ${err.message}`;
            (0, log_1.logError)(err);
            return Promise.resolve({ guildConfig: null, msg: null });
        })
            .then((previous) => __awaiter(void 0, void 0, void 0, function* () {
            const guildConfig = previous.guildConfig;
            const responseMessage = previous.msg;
            const prefix = guildConfig ? guildConfig.prefix : exports.DEFAULT_PREFIX;
            const queue = (0, audio_1.getQueue)(guild);
            const clientGuildMem = message.client.user ? guild.members.fetch(message.client.user.id) : null;
            return new Promise((resolve, reject) => {
                var _a;
                if (responseMessage)
                    message.channel.send(responseMessage);
                if (message.content.startsWith(prefix))
                    isCommand = true;
                // check here if message is sent in bot channel if set-up
                if (isCommand && guildConfig) {
                    if (guildConfig.botChannels.size !== 0 && !guildConfig.botChannels.has(message.channel.id)) {
                        if (message.content.split(' ')[0].toLowerCase().slice(prefix.length).trim() === 'togglebotchannel')
                            return resolve(guildConfig);
                        message.channel.send(`Please use a bot channel to interact with me, such as ${guildConfig.botChannels.values().next().value.name}`).then(reply => {
                            (0, types_1.wait)(10 * 1000).then(() => {
                                Promise.all([reply.delete(), message.delete()]).catch(err => {
                                    err.message = `WARNING: Unable to delete message! Has it already been deleted? ${err.message}`;
                                    (0, log_1.logError)(err);
                                });
                            }).catch(err => reject(err));
                        });
                        isCommand = false; // to skip execution
                        return resolve(guildConfig);
                    }
                    else if (!queue.textChannel) {
                        if (message.channel instanceof Discord.TextChannel)
                            queue.textChannel = message.channel; // as queue is defined message channel is guild type
                        return resolve(guildConfig);
                    }
                }
                const userAccent = (_a = guildConfig === null || guildConfig === void 0 ? void 0 : guildConfig.accents.get(message.author.id)) !== null && _a !== void 0 ? _a : { user: 'none', accent: 'none' }; // in case undefined, use no accent
                // auto-accent
                if (!isCommand && (guildConfig === null || guildConfig === void 0 ? void 0 : guildConfig.autoAccent) && userAccent.accent !== 'none') {
                    if (!queue.voiceChannel && member.voice.channel) {
                        queue.setVoiceChannel(member.voice.channel);
                    }
                    if (queue.voiceChannel && queue.voiceChannel.members.has(message.author.id)) {
                        if (clientGuildMem) {
                            clientGuildMem.then(member => {
                                if (member && queue.voiceChannel && !queue.voiceChannel.permissionsFor(member).has(['CONNECT', 'SPEAK'])) {
                                    message.channel.send('I need permissions to join and speak in your voice channel!');
                                    return reject(Error('Insufficient Permissions'));
                                }
                                const args = [userAccent.accent, message.content];
                                const accentFunc = client.commands.get('accent');
                                if (accentFunc)
                                    accentFunc.execute(message, args);
                                else {
                                    const moduleError = Error('WARNING: Cannot execute "accent" bombo module!');
                                    (0, log_1.logError)(moduleError);
                                    // return reject(moduleError); // Harsh to reject when autoaccent doesn't work
                                }
                            }, err => reject(err));
                        }
                    }
                }
                return resolve(guildConfig);
            });
        }))
            .catch(err => {
            if (err) {
                // isCommand = false;
                err.message = `WARNING: Cannot update config file! ${err.message}`;
                (0, log_1.logError)(err);
            }
        })) !== null && _a !== void 0 ? _a : null;
    }
    if (!isCommand)
        return;
    const queue = guild ? (0, audio_1.getQueue)(guild) : null;
    const args = message.content.slice((_b = guildConf === null || guildConf === void 0 ? void 0 : guildConf.prefix.length) !== null && _b !== void 0 ? _b : exports.DEFAULT_PREFIX.length).trim().split(/ +/);
    const commandName = (_d = (_c = args.shift()) === null || _c === void 0 ? void 0 : _c.toLowerCase()) !== null && _d !== void 0 ? _d : '';
    let command;
    try {
        command = client.commands.get(commandName) ||
            client.commands.find(cmd => { var _a, _b; return (_b = (_a = cmd.aliases) === null || _a === void 0 ? void 0 : _a.includes(commandName)) !== null && _b !== void 0 ? _b : false; });
        if (!command)
            throw Error();
    }
    catch (_err) { // Catches the exception that could be thrown should the try block not find the command
        (0, log_1.log)(`Command "${commandName}" doesn't exist!`);
        message.reply('sorry, unable to find command...');
        return;
    }
    if (command.textBound && queue && queue.textChannel && message.channel.id !== queue.textChannel.id) {
        message.channel.send(`Bot is bound to ${queue.textChannel.name}, please use this channel to queue!`).then(botMsg => {
            (0, types_1.wait)(10 * 1000).then(() => {
                try {
                    botMsg.delete();
                    message.delete();
                }
                catch (err) {
                    (0, log_1.log)('Unable to delete a text channel-bound command request...');
                }
            }).catch(err => (0, log_1.logError)(err));
        }, err => { err.message = `WARNING: Cannot send message! ${err.message}`; (0, log_1.logError)(err); });
    }
    if (!command.dmCompatible && message.channel.type === 'DM') {
        message.reply('I can\'t execute that command inside DMs!');
        return;
    }
    if (command.args && args.length < command.args) { // If command requires arguments and user supplied none
        let reply = `You didn't provide correct arguments, ${message.author}!`;
        reply += `\nThe proper usage would be: \`${(_e = guildConf === null || guildConf === void 0 ? void 0 : guildConf.prefix) !== null && _e !== void 0 ? _e : exports.DEFAULT_PREFIX}${command.name} ${command.usage}\``;
        message.channel.send(reply);
        return;
    }
    const voiceChannel = (_f = message.member) === null || _f === void 0 ? void 0 : _f.voice.channel;
    if (command.voiceConnection && !voiceChannel) {
        message.reply('please join a voice channel to perform this action!');
        return;
    }
    if (command.voiceConnection &&
        voiceChannel &&
        message.client.user &&
        ((_h = !((_g = voiceChannel.permissionsFor(message.client.user)) === null || _g === void 0 ? void 0 : _g.has(['CONNECT', 'SPEAK']))) !== null && _h !== void 0 ? _h : false)) {
        // check permissions exist on bot user, if not assume no permissions
        message.channel.send('I need permissions to join and speak in your voice channel!');
        return;
    }
    command.execute(message, args).catch(err => {
        err.message = `SEVERE: Execution of "${commandName}" stopped! ${err.message}`;
        (0, log_1.logError)(err); // For example when running a guild-related query in a DM environment without setting guildOnly to true.
        message.reply('there was an error trying to execute that command!');
    });
}));
/**
 * Gracefully shutdown: ensures client disconnection from voice channels and logs uptime.
 * @param code exit code
 */
function exitHandler(code = undefined) {
    var _a;
    if (code === -1) { // incompatible node version
        (0, log_1.log)('Shutting down bot!');
        process.exitCode = -1;
        process.exit();
    }
    else if (!exiting) {
        exiting = true;
        for (const queue of audio_1.queueMap)
            queue[1].clean();
        client.destroy();
        (0, log_1.log)(`Shutting down bot after ${(0, audio_1.ConvertSecToFormat)(((_a = client.uptime) !== null && _a !== void 0 ? _a : 0) / 1000)}s of operation!`);
        if (code)
            process.exitCode = code;
        setTimeout(() => {
            console.log('Forced Exit!');
            process.exitCode = 1;
            process.exit();
        }, 10 * 1000).unref();
    }
    else {
        (0, log_1.log)('Shutdown already initiated! Ignoring further calls!');
    }
}
let INT = false;
process.on('SIGINT', () => {
    if (!INT) {
        INT = true;
        exitHandler(0);
    }
    else {
        (0, log_1.log)('Interruption signal received, awaiting shutdown!');
    }
});
process.on('SIGTERM', () => exitHandler(0));
process.on('multipleResolves', (type, _promise, reason) => {
    let errMessage;
    if (reason instanceof Error)
        errMessage = `${reason.message} at ${reason.stack}`;
    else
        errMessage = reason;
    (0, log_1.log)(`Multiple promise resolutions! ${type} with message: ${errMessage}`);
});
process.on('uncaughtException', (err) => {
    err.message = `FATAL: Uncaught Exception: ${err.message}`;
    (0, log_1.logError)(err);
    exitHandler(1);
});
process.on('unhandledRejection', (reason, _promise) => {
    if (reason instanceof Error) {
        reason.message = `FATAL: Unhandled Promise Rejection: ${reason.message}`;
        (0, log_1.logError)(reason);
    }
    else {
        (0, log_1.logError)(Error('FATAL: Unhandled Promise Rejection!'));
    }
    exitHandler(1);
});
client.on('error', err => {
    err.message = `WARNING: DiscordJS Client Error!: ${err.message}`;
    (0, log_1.logError)(err);
});
if (token) {
    client.login(token);
}
//# sourceMappingURL=index.js.map