'use strict';   // DO_NOT_REMOVE Is used for correct building.

const l = require(`./log.js`);
const fs = require(`fs`);
const Discord = require(`discord.js`);
const path = require('path');
const { exit } = require("process");    // I can't be bothered to remove it as it will mean rewriting my build code

function checkNodeVersion()
{
    if (parseInt(process.versions.node.split(`.`)[0]) < 12) throw Error(`Use Node version 12 or greater!`);
    l.log(`You're running node.js ${process.version}`);
}

checkNodeVersion();

const client = new Discord.Client();

let token;
if (process.env.TOKEN)
{
    token = process.env.TOKEN;
}
else
{
    token = fs.readFileSync(`.token`, `utf8`, (err, data) => 
    {
        if (err) throw `FATAL: Cannot read token`;
        // l.log(data);
    }).split(`\n`)[0];
}

global.prefix = "|";

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

    
    l.log('Running in testing mode!');
    require(`./${path.join(`tests`,`test_client.js`)}`);
// DO_NOT_REMOVE:ADD TEST_FUNC1

});

// Basic command handler
client.on("message", message => 
{
    if (!message.content.startsWith(prefix) || message.channel.type !== `text`) return;

        
    if (message.guild.id !== '770990591357747221' && message.channel.id !== `770990593181483040`) return;
    if (message.content ===`${prefix}botquit`)
    {
        l.log("Test completed!");
        exit();
    }
// DO_NOT_REMOVE:ADD TEST_FUNC2

    // DO_NOT_REMOVE:RM INDEX_FUNC2

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
