'use strict';

const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports = 
{
    name: `remove`,
    alisases: [`r`],
    description: `Gets rid of a song in the queue`,
    usage: `<song position>`,
    args: true,
    guildOnly: true,
    execute(message, args)
    {
        const currentQueue = am.getQueue(message);

        currentQueue.remove(parseInt(args[0]) - 1).then( _msg =>
            {
                message.channel.send(`Removed Track ${args[0]}: ${currentQueue.songList[args[0]].title} [${am.ConvertSecToFormat(currentQueue.songList[args[0]].duration)}]`);
            }, err =>
            {
                err.message = `WARNING: Error removing track ${err.message}`;
                message.channel.send(`Error removing track!`);
                l.logError(err);
            });
    }
};
