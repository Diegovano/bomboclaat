const { exit } = require("process");
const l = require(`../log.js`);
const fs = require(`fs`);
const path = require('path');
const os = require('os');
const i = require("../index.js");

function getLineBreakChar(string) 
{
    const indexOfLF = string.indexOf('\n', 1);  // No need to check first-character

    if (indexOfLF === -1) 
{
        if (string.indexOf('\r') !== -1) return '\r';

        return '\n';
    }

    if (string[indexOfLF - 1] === '\r') return '\r\n';

    return '\n';
}

const str_tests = fs.readFileSync(path.join('tests','test-commands.txt'), `utf8`);   // Write all commands in here

const tests = str_tests.split(getLineBreakChar(str_tests));     // runs in whatever line ending you want

const str_results = fs.readFileSync(path.join(`tests`,`expected-results.txt`), `utf8`);  // Write all expected results heres

var results = str_results.split(getLineBreakChar(str_results));

const channelName = "769321347838771231";

i.client.once("ready", () => 
{
    l.log(`Ready!`);
    const channel = i.client.channels.cache.get(channelName);
    for (const testcommand of tests)
    {
        channel.send(i.prefix+testcommand);
    }
}
);

// basic command handler
i.client.on("message", message => 
{    
    if (!message.author.bot || !message.channel.id === channelName) return;

    if (!message.content.startsWith(i.prefix))
    {
        const index = results.indexOf(message.content);
        if (index > -1) 
{
            results.splice(index, 1);
        }
        else 
        {
            throw `Unexpected response from test, received: ${message.content}, but could only be: ${results}`;
        }
    
        if (results.length === 0)
        {
            l.log("Test completed!");
            exit();
        }
    }
    else
    {

        const args = message.content.slice(i.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command;
            
        command = i.client.commands.get(commandName)
            || i.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) throw `error`;

        command.execute(message, args);

    }

});

i.client.login(i.token);
