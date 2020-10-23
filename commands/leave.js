const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports = 
{
    name: `leave`,
    aliases: [`quit`, `l`, `bye`],
    description: `Tells the bot to disconnect from the voice channel.`,
    guildOnly: true,
    execute(message, args)
    {
        try 
        {
            message.member.voice.channel.leave();
            am.deleteQueue(message);
        }
        catch (error) 
        {
            l.logError(Error(`WARNING: ${error}`));
        }
    }
};