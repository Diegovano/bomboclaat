'use strict';

const l = require('./log.js');
const fs = require('fs');
const Discord = require('discord.js');
const path = require('path');
const conf = require('./configFiles.js');
const am = require('./audio.js');

const prefix = '|';

function checkNodeVersion () {
  if (parseInt(process.versions.node.split('.')[0]) < 12) {
    l.logError(Error('Use Node version 12 or greater!'));
    exitHandler(-1);
  }
  l.log(`You're running node.js ${process.version}`);
}

checkNodeVersion();

const client = new Discord.Client();

let token;
if (process.env.TOKEN) {
  token = process.env.TOKEN;
} else {
  try {
    token = fs.readFileSync('.token', 'utf8');
  } catch (err) {
    l.logError(Error('FATAL: Cannot read token'));
    exitHandler(-1);
  }
}

// @ts-ignore
client.commands = new Discord.Collection(); // Holds all commands

// Add commands to collection
const commandFiles = fs.readdirSync('commands').filter(file => path.extname(file) === '.js');
for (const file of commandFiles) {
  const command = require(`./${path.join('commands', file)}`);
  // @ts-ignore
  client.commands.set(command.name, command);
}

client.once('ready', () => l.log('Ready!'));

// Basic command handler
client.on('message', async message => {
  if (message.author.bot) return;

  let isCommand = false;

  if (message.channel.type !== 'text') {
    if (!message.content.startsWith('|')) return;
  } else { // Add user to accent database if not present
    await conf.config.initGuild(message) // setup guild in config file
      .then(() => {
        return new Promise((resolve, reject) => {
          conf.config.accentUser(message, 'none', false).then(msg => {
            resolve(msg);
          }, err => {
            reject(err);
          });
        });
      })
      .then(msg => {
        return new Promise((resolve, reject) => {
          if (msg) message.channel.send(msg);

          if (message.content.startsWith(conf.config.configObject[message.guild.id].prefix)) isCommand = true;

          const currentQueue = am.getQueue(message);

          // check here if message is sent in bot channel if set-up
          if (isCommand) {
            const guildConfig = conf.config.configObject[message.guild.id]; // should always have value if guild is inited
            if (guildConfig) {
              if (Object.keys(guildConfig.botChannels).length !== 0 && !guildConfig.botChannels[message.channel.id]) {
                if (message.content.split(' ')[0].toLowerCase().slice(prefix.length).trim() === 'togglebotchannel') return resolve();
                message.channel.send(`Please use a bot channel to interact with me, such as ${Object.values(guildConfig.botChannels)[0].name}`).then(msg => {
                  setTimeout(() => {
                    try {
                      msg.delete();
                      message.delete();
                    } catch (err) {
                      err.message = `WARNING: Unable to delete message! Has it already been deleted? ${err.message}`;
                      l.logError(err);
                    }
                  }, 10000);
                });
                isCommand = false; // to skip execution
                return resolve();
              } else if (!currentQueue.textChannel) {
                currentQueue.textChannel = message.channel;
                return resolve();
              }
            }
          }

          // auto-accent
          if (!isCommand && conf.config.configObject[message.guild.id].autoAccent && conf.config.configObject[message.guild.id].accents[message.author.id].accent !== 'none') {
            if (!currentQueue.voiceChannel && message.member.voice.channel) {
              currentQueue.setVoiceChannel(message.member.voice.channel);
            }

            if (currentQueue.voiceChannel && currentQueue.voiceChannel.members.has(message.author.id)) {
              if (!currentQueue.voiceChannel.permissionsFor(message.client.user).has(['CONNECT', 'SPEAK'])) {
                message.channel.send('I need permissions to join and speak in your voice channel!');
                return reject(Error('Insufficient Permissions'));
              }

              const args = [conf.config.configObject[message.guild.id].accents[message.author.id].accent, message.content];
              // @ts-ignore
              client.commands.get('accent').execute(message, args);
            }
          }
          resolve();
        });
      })
      .catch(err => {
        if (err) {
          err.message = `WARNING: Cannot update config file! ${err.message}`;
          l.logError(err);
        }
      });
  }

  if (!isCommand) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  let command;

  try {
    // @ts-ignore
    command = client.commands.get(commandName) ||
              // @ts-ignore
              client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) throw Error();
  } catch (_err) { // Catches the exception that could be thrown should the try block not find the command
    l.log(`Command "${commandName}" doesn't exist!`);
    message.reply('sorry, unable to find command...');
    return;
  }

  if (command.textBound && message.channel.id !== am.getQueue(message).textChannel.id) {
    message.channel.send(`Bot is bound to ${am.getQueue(message).textChannel.name}, please use this channel to queue!`).then(botMsg => {
      setTimeout(() => {
        try {
          botMsg.delete();
          message.delete();
        } catch (err) {
          l.log('Unable to delete a text channel-bound command request...');
        }
      }, 10 * 1000);
    });
  }

  if (!command.dmCompatible && message.channel.type === 'dm') {
    return message.reply('I can\'t execute that command inside DMs!');
  }

  if (command.args && args.length < command.args) { // If command requires arguments and user supplied none
    let reply = `You didn't provide correct arguments, ${message.author}!`;

    if (command.usage) { // If command specifies which arguments are required and their usage
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }
    return message.channel.send(reply);
  }

  const voiceChannel = message.member.voice.channel;
  if (command.voiceConnection && !voiceChannel) return message.reply('please join a voice channel to perform this action!');
  if (command.voiceConnection && !voiceChannel.permissionsFor(message.client.user).has(['CONNECT', 'SPEAK'])) return message.channel.send('I need permissions to join and speak in your voice channel!');

  try {
    command.execute(message, args);
  } catch (err) { // If any exceptions are thrown during the execution of a command, stop running the command and run the following
    err.message = `SEVERE: Execution of "${commandName}" stopped! ${err.message}`;
    l.logError(err); // For example when running a guild-related query in a DM environment without setting guildOnly to true.
    message.reply('there was an error trying to execute that command!');
  }
});

let exiting = false;

function exitHandler (code = undefined) {
  if (!exiting) {
    exiting = true;
    for (const queue of am.queueMap) queue[1].clean();
    client.destroy();
    l.log(`Shutting down bot after ${am.ConvertSecToFormat(client.uptime / 1000)}s of operation!`);
    if (code) process.exitCode = code;
    setTimeout(() => {
      console.log('Forced Exit!');
      process.exitCode = 1;
      process.exit();
    }, 10 * 1000).unref();
  } else {
    l.log('Shutdown already initiated! Ignoring further calls!');
  }
}

let INT = false;

process.on('SIGINT', () => {
  if (!INT) {
    INT = true;
    exitHandler(0);
  } else {
    l.log('Interruption signal received, awaiting shutdown!');
  }
});

process.on('SIGTERM', () => exitHandler(0));

process.on('multipleResolves', (type, promise, reason) =>
  l.log(`Multiple promise resolutions! ${type} ${promise} with message ${reason}`));

process.on('uncaughtException', (err, _origin) => {
  err.message = `FATAL: Uncaught Exception: ${err.message}`;
  l.logError(err);
  exitHandler(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  if (reason instanceof Error) {
    reason.message = `FATAL: Unhandled Promise Rejection: ${reason.message}`;
    l.logError(reason);
  } else {
    l.logError('FATAL: Unhandled Promise Rejection!');
  }
  exitHandler(1);
});

client.on('error', err => {
  err.message = `WARNING: DiscordJS Client Error!: ${err.message}`;
  l.logError(err);
});

if (token) {
  client.login(token);
}
