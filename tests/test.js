const l = require(`../log.js`);
const fs = require(`fs`);
const Discord = require(`discord.js`);
const { exit } = require("process");

function checkNodeVersion()
{
    if (parseInt(process.version[1] + process.version[2]) < 12) throw `Use node version 12 or greater!`;
    l.log(`You're running node.js ${process.version}`);
}

checkNodeVersion();

const client = new Discord.Client();

const prefix = "|";

const channelName = "769321347838771231";

if (typeof process.env.TOKEN === "undefined")   // Check if running github actions or just locally
{

    const tokens = fs.readFileSync(`.token`, `utf8`, (err, data) => 
    {
        if (err) throw `FATAL: Cannot read token`;
    }).split(`\n`);

    var token = tokens[0];
}
else
{
    token = process.env.TOKEN
}

client.commands = new Discord.Collection(); // Holds all commands

const tests = fs.readFileSync(`tests/test-commands.txt`, `utf8`).split(`\n`);   // Write all commands in here

const results = fs.readFileSync(`tests/expected-results.txt`, `utf8`).split(`\n`);  // Write all expected results heres

// Add commands to collection
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith(`.js`));
for (const file of commandFiles)
{
    const command = require(`../commands/${file}`);
    client.commands.set(command.name, command);
}

client.once("ready", () => 
{
    l.log(`Ready!`)
    const channel = client.channels.cache.get(channelName)
    for (const testcommand of tests)
    {
        channel.send(testcommand)
    }
}
);

// basic command handler
client.on("message", message => 
{    
    if (!message.author.bot || !message.channel.id === channelName) return;

    if (!message.content.startsWith(prefix))
    {
        const index = results.indexOf(message.content);
        if (index > -1) {
            results.splice(index, 1);
        }
        else 
        {
            throw "Unexpected response from test."
        }
    
        if (results.length === 0)
        {
            l.log("Test completed!");
            process.exit()
        }
    }
    else
    {

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command;
            
        command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) throw `error`;

        command.execute(message, args);

    }

});

client.login(token);

