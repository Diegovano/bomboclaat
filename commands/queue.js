const am = require(`../audio.js`);

module.exports =
{
    name: `queue`,
    aliases: [`q`, `list`, `next`, `playlist`],
    description: `Print a list of the songs added to the queue since the bot joined the voice channel.`,
    execute(message, args)
    {
        am.getQueue(message).printQueue(message);
    }
};
