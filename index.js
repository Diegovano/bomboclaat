'use strict';

const l = require(`./log.js`);
const fs = require(`fs`);
const Discord = require(`discord.js`);
const path = require('path');
const { exit } = require("process");

function checkNodeVersion()
{
    if (parseInt(process.versions.node.split(`.`)[0]) < 12) throw Error(`Use Node version 12 or greater!`);
    l.log(`You're running node.js ${process.version}`);
}

checkNodeVersion();

const client = new Discord.Client();
const tokens = fs.readFileSync(`.token`, `utf8`, (err, data) => 
{
    if (err) throw `FATAL: Cannot read token`;
    // l.log(data);
}).split(`\n`);

const token = tokens[0];

const prefix = "|";

client.commands = new Discord.Collection(); // Holds all commands

// Add commands to collection
const commandFiles = fs.readdirSync(`commands`).filter(file => path.extname(file) === `.js`);
for (const file of commandFiles)
{
    const command = require(`./${path.join(`commands`, file)}`);
    client.commands.set(command.name, command);
}

client.once("ready", () => 
{
    l.log(`Ready!`);
    if(process.env.TEST)
    {
        l.log('Running in testing mode!');
        require(`./${path.join(`tests`,`test.js`)}`); // I could not think of another way of making this work... :(
    }
});

// Basic command handler
client.on("message", message => 
{
    if (!message.content.startsWith(prefix) || message.channel.type !== `text`) return;

    if (process.env.TEST)    // Cannot chain ifs due to undefined
    {
        if (message.guild.id !== '770990591357747221' && message.channel.id !== `770990593181483040`) return;
        if (message.content ===`${prefix}botquit`)
        {
            l.log("Test completed!");
            exit();
        }
    }

    else
    {
        if (message.guild.id !== '684842282926473287' || message.author.bot) return;
        if (message.channel.id !== `697492398070300763`)
        {
            return message.channel.send(`Please use the bot channel to interact with me!`).then( msg =>
                {
                    setTimeout(() =>
                    {
                        try 
                        {
                            msg.delete();
                            message.delete();
                        } 
                        catch (error) 
                        {
                            l.logError(Error(`WARNING: Unable to delete message! Has it already been deleted?`));
                        }
                    }, 10000);
                });
        }
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    let command;
 
    try 
    {        
        command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) throw `error`;
    } 
    catch (error) // Catches the exception that could be thrown should the try block not find the command
    {
        l.log(`Command "${commandName}" doesn't exist!`);
        message.reply(`sorry, unable to find command...`);
        return;
    }

    if (command.guildOnly && message.channel.type === `dm`)
    {
        return message.reply(`I can't execute that command inside DMs!`);
    }

    if (command.args && !args.length) // If command requires arguments and user supplied none
    {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) // If command specifies which arguments are required and their usage
        {
            reply += `\nThe proper usage would be: ${prefix}${command.name} ${command.usage}`;
        } 
        
        return message.channel.send(reply);
    }
    
    try 
    {
        command.execute(message, args);
    } 
    catch (error) // If any exceptions are thrown during the execution of a command, stop running the command and run the following
    {
        error.message = `SEVERE: Execution of "${commandName}" stopped! ${error.message}`;
        l.logError(error); // For example when running a guild-related query in a DM environment without setting guildOnly to true.
        message.reply(`there was an error trying to execute that command!`);
    }
});


client.login(token);

exports.prefix = prefix;
