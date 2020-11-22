'use strict';

const am = require(`../audio.js`);

module.exports = 
{
    name: `remove`,
    alisases: [`r`],
    description: `Gets rid of a song in the queue`,
    usage: `[song position]`,
    guildOnly: true,
    execute(message, args)
    {
        const currentQueue = am.getQueue(message);

        if (currentQueue.queuePos > args[0])
        {
            currentQueue.queuePos--;
        }

        currentQueue.songList.splice(parseInt(args[0]) - 1, 1);
    }
};
