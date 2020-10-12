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
            message.channel.send(`Artist: ${currentQueue.getSong().author}\nTrack: ${currentQueue.getSong().title}`);
            let lyricsLF = await lyricsFinder(currentQueue.getSong().author, currentQueue.getSong().title);
            message.channel.send(`LyricsFinder: ${lyricsLF}`);
        } 
        catch(error) 
        {
            message.channel.send(`Unable to get lyrics for current track! Is player paused?`);
        }

    }
};