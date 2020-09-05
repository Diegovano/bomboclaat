module.exports = 
{
    name: `leave`,
    aliases: [`quit`, `q`, `l`],
    description: `Tells the bot to disconnect from the voice channel.`,
    execute(message, args)
    {
        message.member.voice.channel.leave();
    }
}