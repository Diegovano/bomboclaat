const am = require(`../audio.js`);
const lyricsFinder = require(`lyrics-finder`);

module.exports = 
{
    name: `lyrics`,
    aliases: [`words`, `paroles`, `ly`],
    description: `Find and print the lyrics for the current track.`,
    guildOnly: true,
    async execute(message, args)
    {
        var currentQueue = am.getQueue(message);

        try 
        {
            let lyrics = await lyricsFinder(``, currentQueue.getSong().title) || `Lyrics not found!`;
            message.channel.send(lyrics);
        } 
        catch(error) 
        {
            message.channel.send(`Unable to get lyrics for current track! Is player paused?`);
        }

    }
};