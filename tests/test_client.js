const { exit } = require("process");
const l = require(`../log.js`);
const fs = require(`fs`);
const path = require('path');
const Discord = require('discord.js');


let token;
if (process.env.TOKENT)
{
    token = process.env.TOKENT;
}
else
{
    token = fs.readFileSync(`.tokent`, `utf8`, (err, data) => 
    {
        if (err) l.log("Cannot read test tokent!");
    });
}

let client = new Discord.Client();

const channelName = "770990593181483040";

client.tests = new Discord.Collection(); // Holds all tests

const testFiles = fs.readdirSync(path.join('tests',`commands`)).filter(file => path.extname(file) === `.js`);
for (const file of testFiles)
{
    const test = require(`./${path.join(`commands`,file)}`);
    client.tests.set(test.name, test);
}


client.once("ready", () => 
{
    l.log(`Ready!`);
    const channel = client.channels.cache.get(channelName);
    channel.send(prefix + tests[count]);
    count += 1;
}
);

// basic command handler
client.on("message", message => 
{    
    if (!message.author.bot || !message.channel.id === channelName || message.content === `Bye! Bye!`) return;

    if (!message.content.startsWith(prefix))
    {
        let test;
        
        try 
        {        
            test = client.tests.get(message.content)
                || client.tests.find(tst => tst.aliases && tst.aliases.includes(message.content));
            if (!test) throw `error`;
        } 
        catch (error) // Catches the exception that could be thrown should the try block not find the command
        {
            throw `Unexpected response from test, received: ${message.content}.`;
        }

        test.execute(message,prefix);
    
        if (count === tests.length)
        {
            message.channel.send(`${prefix}botquit`).then(connection=>
                {
                    exit();
                });
        }
    }
});

client.on('voiceStateUpdate', (oldMember, newMember) => 
{
    const newUserChannel = newMember.channel;
    const oldUserChannel = oldMember.channel;
  
  
    if(oldUserChannel === null && newUserChannel !== null)    // User Joins a voice channel
    {
  
        if (tests[count]===`play https://www.youtube.com/watch?v=TZNQEYto97c`)
        {
            newUserChannel.client.channels.cache.get("770990593181483040").send(prefix + tests[count]);
            count += 1;
        }
  
    }
    
    else if(newUserChannel === null)     // User leaves a voice channel
    {
  
        if (tests[count]===`ping`)
        {
            oldUserChannel.client.channels.cache.get("770990593181483040").send(prefix + tests[count]);
            count+=1;
            oldUserChannel.leave();
        }  
    }
});

client.login(token);
