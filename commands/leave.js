const am = require(`../audio.js`);

module.exports = 
{
    name: `leave`,
    aliases: [`quit`, `l`, `bye`],
    description: `Tells the bot to disconnect from the voice channel.`,
    guildOnly: true,
    execute(message, args)
    {
        let clientVoiceConnection = message.guild.voice;

        // If the bot isn't in a voiceChannel, don't execute any other code
        if(!clientVoiceConnection)
        {
            return message.reply("Bot not in a voice channel, why are you trying to make me leave a voice channel?");
        }

        let userVoiceChannel = message.member.voice.channel;

        if (!userVoiceChannel) 
{
            return message.reply("You are not in a voice channel, Bot cannot leave!");
        }

        // Compare the voiceChannels
        if (userVoiceChannel === clientVoiceConnection.channel) 
        {
            am.deleteQueue(message,true);
            userVoiceChannel.leave();
            return message.channel.send('Bye! Bye!');
        } 

        else 
        {
            return message.reply('We are not in the same voice channel stoopid!');
        }
        
    }
};