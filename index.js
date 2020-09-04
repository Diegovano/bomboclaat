function checkNodeVersion()
{
    if (parseInt(process.version[1] + process.version[2]) < 12) throw `Use node version 12 or greater!`;
    console.log("You're running node.js " + process.version);
}

checkNodeVersion();

const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
var token = fs.readFileSync(`.token`, `utf8`, function(err, data)
{
    if (err) throw `FATAL: Cannot read token`;
    // console.log(data);
});

const prefix = "|";

client.commands = new Discord.Collection(); // Holds all commands

// Add commands to collection
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles)
{
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// run

client.once("ready", () => console.log(`Ready!`));

// basic command handler
client.on("message", message => 
{
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/); // Look into regex to understand / +/
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
        console.log(`INFO: Command "${commandName}" doesn't exist!`);
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
        console.error(`SEVERE: Execution of "${commandName}" stopped! ${error.message}`); // For example when running a guild-related query in a DM environment without setting guildOnly to true.
        message.reply(`There was an error trying to execute that command!`);
    }
});


client.login(token);