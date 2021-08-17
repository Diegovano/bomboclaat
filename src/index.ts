'use strict';

import * as Discord from 'discord.js';
import { getQueue, queueMap, ConvertSecToFormat } from './audio';
import { readdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';
import { config, configObjectType } from './configFiles';
import { log, logError } from './log';
import { bomboModule, Message } from './types';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

export const DEFAULT_PREFIX = 'v3'; /// //////// DEBUG VALUE

/**
 * Ensure environement is running correct version of Node.JS for discord.js.
 */

function checkNodeVersion () {
  if (parseInt(process.versions.node.split('.')[0]) < 14) {
    logError(Error('Use Node version 14.0.0 or greater!'));
    exitHandler(-1);
  } else log(`You're running node.js ${process.version}`);
}

checkNodeVersion();

/**
 * Extends base Discord Client class by adding commands Collection. This allows all commands to be accessed through the client.
 * @extends Discord.Client
 */

class Client extends Discord.Client {
  constructor (ClientOptions: Discord.ClientOptions) {
    super(ClientOptions);
    this.commands = new Discord.Collection();
  }

  commands: Discord.Collection<string, bomboModule>;
}

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS']
  // disableMentions: 'all',
  // messageCacheLifetime: 120,
  // messageSweepInterval: 60
});

let token: string| undefined;
if (process.env.TOKEN) {
  token = process.env.TOKEN;
} else {
  try {
    token = readFileSync(`${join(process.cwd(), '.token')}`, 'utf8');
  } catch (err) {
    logError(Error('FATAL: Cannot read token'));
    exitHandler(-1);
  }
}

// Add commands to collection
const commandFiles = readdirSync(`${join(process.cwd(), 'build', 'src', 'commands')}`).filter(file => extname(file) === '.js');
const clientId = '697504121795641455';
const guildId = '684842282926473287';
const commands: JSON[] = [];
const imports: Promise<void>[] = [];
for (const file of commandFiles) {
  // const command = require(`${join(process.cwd(), 'src', 'commands', file)}`);

  imports.push(import(`${join(process.cwd(), 'build', 'src', 'commands', file)}`).then((command: { module: bomboModule }) => {
    client.commands.set(command.module.name, command.module);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    commands.push((command.module.slashCommand.setName(command.module.name).setDescription(command.module.description)).toJSON());
  }, err => {
    err.message = `WARNING: Could not load ${file}! ${err.message}`;
    logError(err);
  }));
}

Promise.allSettled([imports]).then(() => {
  if (token) {
    const rest = new REST({ version: '9' }).setToken(token);

    (async () => {
      try {
        console.log('Started refreshing application slash commands.');

        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId), { body: commands }
        );

        console.log('Successfully reloaded application slash commands.');
      } catch (error) {
        console.error(error);
      }
    })();
  }
});
async function initialiseGuildConfig (guildConfig: configObjectType | null, message: Discord.Message) {
  return new Promise<{ guildConfig: configObjectType | null, msg: string | null }>((resolve, reject) => {
    if (!guildConfig) return resolve({ guildConfig: null, msg: null });
    config.accentUser(message, 'none', false).then(msg => {
      return resolve({ guildConfig: guildConfig, msg: msg });
    }, err => {
      return reject(err);
    });
  });
}

client.once('ready', () => log('Ready!'));

// @ts-expect-error yes, discord message class does not have commands but we have added them. Message type will have commands property!
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  const guild = message.guild;
  const member = message.member;
  if ((message.channel instanceof Discord.TextChannel) && guild && member) {
    return await config.get(guild) // setup guild in config file
      .then(async guildConfig => initialiseGuildConfig(guildConfig, message), err => {
        err.message = `WARNING: Unable to read guildConfig but attempting to continue! ${err.message}`;
        logError(err);
        return Promise.resolve({ guildConfig: null, msg: null });
      })
      .then(async previous => {
        const guildConfig = previous.guildConfig;
        // const responseMessage = previous.msg;
        //
        // const prefix = guildConfig ? guildConfig.prefix : DEFAULT_PREFIX;
        // const queue = getQueue(guild);
        // const clientGuildMem = message.client.user ? guild.members.fetch(message.client.user.id) : null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return new Promise<configObjectType | null>((resolve, reject) => {
          // if (responseMessage) message.channel.send(responseMessage);
          //
          // if (message.content.startsWith(prefix)) isCommand = true;
          //
          // const userAccent = guildConfig?.accents.get(message.author.id) ?? { user: 'none', accent: 'none' }; // in case undefined, use no accent
          //
          // // auto-accent
          // if (!isCommand && guildConfig?.autoAccent && userAccent.accent !== 'none') {
          //   if (!queue.voiceChannel && member.voice.channel) {
          //     queue.setVoiceChannel(member.voice.channel);
          //   }
          //
          //   if (queue.voiceChannel && queue.voiceChannel.members.has(message.author.id)) {
          //     if (clientGuildMem) {
          //       clientGuildMem.then(member => {
          //         if (member && queue.voiceChannel && !queue.voiceChannel.permissionsFor(member).has(['CONNECT', 'SPEAK'])) {
          //           message.channel.send('I need permissions to join and speak in your voice channel!');
          //           return reject(Error('Insufficient Permissions'));
          //         }
          //
          //         const args = [userAccent.accent, message.content];
          //         const accentFunc = client.commands.get('accent');
          //         if (accentFunc) accentFunc.execute(message, args);
          //         else {
          //           const moduleError = Error('WARNING: Cannot execute "accent" bombo module!');
          //           logError(moduleError);
          //           // return reject(moduleError); // Harsh to reject when autoaccent doesn't work
          //         }
          //       });
          //     }
          //   }
          // }
          return resolve(guildConfig);
        });
      })
      .catch(err => {
        if (err) {
          err.message = `WARNING: Cannot update config file! ${err.message}`;
          logError(err);
        }
      }) ?? null;
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command: bomboModule | undefined = client.commands.get(interaction.commandName);
  if (!command) {
    logError(new Error(`Command "${interaction.commandName}" doesn't exist!`));
    return;
  }
  const guildConfig = interaction.guild ? await config.get(interaction.guild) : null;
  const queue = interaction.guild ? getQueue(interaction.guild) : null;
  if (queue && !queue.textChannel && interaction.channel instanceof Discord.TextChannel) {
    queue.textChannel = interaction.channel;
  }

  if (!command.ignoreBotChannel && interaction.member instanceof Discord.GuildMember && guildConfig && guildConfig.botChannels.size !== 0 && interaction.channel?.id && !guildConfig.botChannels.has(interaction.channel.id)) {
    interaction.reply({ content: `Please use a bot channel to interact with me, such as ${guildConfig.botChannels.values().next().value.name}`, ephemeral: true });
  } else if (command.textBound && queue && queue.textChannel && interaction.channel?.id !== queue.textChannel.id) {
    interaction.reply({ content: `Bot is bound to ${queue.textChannel.name}, please use this channel to queue!`, ephemeral: true });
  } else if (!command.dmCompatible && interaction.channel instanceof Discord.DMChannel) {
    interaction.reply('I can\'t execute that command inside DMs!');
  } else if (command.voiceConnection && interaction.member instanceof Discord.GuildMember && interaction.member.voice.channel) {
    interaction.reply({ content: 'Please join a voice channel to perform this action!', ephemeral: true });
    // eslint-disable-next-line no-dupe-else-if
  } else if (command.voiceConnection &&
      interaction.member instanceof Discord.GuildMember && interaction.member.voice.channel &&
      interaction.client.user &&
      (!interaction.member.voice.channel.permissionsFor(interaction.client.user)?.has(['CONNECT', 'SPEAK']) ?? false)) {
    // check permissions exist on bot user, if not assume no permissions
    interaction.reply('I need permissions to join and speak in your voice channel!');
  } else {
    try {
      command.execute(interaction);
    } catch (err) { // If any exceptions are thrown during the execution of a command, stop running the command and run the following
      err.message = `SEVERE: Execution of "${interaction.commandName}" stopped! ${err.message}`;
      logError(err); // For example when running a guild-related query in a DM environment without setting guildOnly to true.
    }
  }
});

let exiting = false;

/**
 * Gracefully shutdown: ensures client disconnection from voice channels and logs uptime.
 * @param code exit code
 */

function exitHandler (code: number | undefined = undefined) {
  if (!exiting) {
    exiting = true;
    for (const queue of queueMap) queue[1].clean();
    client.destroy();
    log(`Shutting down bot after ${ConvertSecToFormat((client.uptime ?? 0) / 1000)}s of operation!`);
    if (code) process.exitCode = code;
    setTimeout(() => {
      console.log('Forced Exit!');
      process.exitCode = 1;
      process.exit();
    }, 10 * 1000).unref();
  } else {
    log('Shutdown already initiated! Ignoring further calls!');
  }
}

let INT = false;

process.on('SIGINT', () => {
  if (!INT) {
    INT = true;
    exitHandler(0);
  } else {
    log('Interruption signal received, awaiting shutdown!');
  }
});

process.on('SIGTERM', () => exitHandler(0));

process.on('multipleResolves', (type, promise, reason) =>
  log(`Multiple promise resolutions! ${type} ${promise} with message ${reason}`));

process.on('uncaughtException', (err: Error) => {
  err.message = `FATAL: Uncaught Exception: ${err.message}`;
  logError(err);
  exitHandler(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  if (reason instanceof Error) {
    reason.message = `FATAL: Unhandled Promise Rejection: ${reason.message}`;
    logError(reason);
  } else {
    logError(Error('FATAL: Unhandled Promise Rejection!'));
  }
  exitHandler(1);
});

client.on('error', err => {
  err.message = `WARNING: DiscordJS Client Error!: ${err.message}`;
  logError(err);
});

if (token) {
  client.login(token);
}
