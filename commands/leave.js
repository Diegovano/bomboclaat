'use strict';

const am = require(`../audio.js`);

module.exports = 
{
    name: `leave`, // If this name is changed, change the function call in the clear.js command file.
    aliases: [`quit`, `l`, `bye`],
    description: `Tells the bot to disconnect from the voice channel.`,
    guildOnly: true,
    execute(message, args)
    {
        const clientVoiceConnection = message.guild.voice.connection;

        // If the bot isn't in a voiceChannel, don't execute any other code
        if (!clientVoiceConnection)
        {
            return message.reply("I'm not in a voice channel, why are you trying to make me leave?");
        }

        const userVoiceChannel = message.member.voice.channel;

        if (!userVoiceChannel) 
{
            return message.reply("You aren't in a voice channel, please join to tell me to leave!");
        }

        // Compare the voiceChannels
        if (userVoiceChannel === clientVoiceConnection.channel) 
        {
            am.deleteQueue(message, true);
            userVoiceChannel.leave();
            return message.channel.send('Bye! Bye!');
        } 

        else 
        {
            return message.reply('We are not in the same voice channel stoopid!');
        }
        
    }
};