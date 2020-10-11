const am = require(`../audio.js`);

module.exports =
{
    name: `skip`,
    aliases: [`s`, `next`],
    description: `Skip the current track.`,
    guildOnly: true,
    execute(message, args)
    {
        var currentQueue = am.getQueue(message);

        currentQueue.skip(message);
    }
};