const l = require(`./log.js`);
const fs = require(`fs`);
const Discord = require(`discord.js`);
const path = require('path');

// Check node version
if (parseInt(process.version[1] + process.version[2]) < 12) throw Error(`Use Node version 12 or greater!`);
l.log(`You're running node.js ${process.version}`);


// Set up client
const client = new Discord.Client();
var token;
if (!process.env.TOKEN)   // Check if running github actions or just locally
{

    token = fs.readFileSync(`.token`, `utf8`, (err, data) => 
    {
        if (err) throw `FATAL: Cannot read token`;
    });
}
else
{
    token = process.env.TOKEN;
}

const prefix = "^";

client.commands = new Discord.Collection(); // Holds all commands

// Add commands to collection
const commandFiles = fs.readdirSync(`commands`).filter(file => path.extname(file) === `.js`);
for (const file of commandFiles)
{
    const command = require(`./${path.join(`commands`,file)}`);
    client.commands.set(command.name, command);
}

if (require.main === module)
{

    client.once("ready", () => l.log(`Ready!`));

    // basic command handler
    client.on("message", message => 
    {
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        if (message.channel.type === `text` && message.guild.id === `684842282926473287` && message.channel.id !== `697492398070300763`)
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
            error.message = `SEVERE: Execution of "${commandName}" stopped! ${error.message}`
            l.logError(error); // For example when running a guild-related query in a DM environment without setting guildOnly to true.
            message.reply(`there was an error trying to execute that command!`);
        }
    });


    client.login(token);
}

exports.client = client;
exports.prefix = prefix;
exports.token = token;
