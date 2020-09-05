const { VoiceChannel, GuildMember } = require("discord.js")

module.exports = 
{
    name: `join`,
    aliases: [`j`, `hello`],
    description: `Tell the bot to join your voice channel.`,
    execute(message, args)
    {
        if (!message.member.voice.channel)
        {
            return message.reply(`You aren't in a Voice Channel! Bot cannot connect!`);
        }

        const connection = message.member.voice.channel.join();
    }
}