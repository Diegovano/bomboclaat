'use strict';

const am = require(`../audio.js`);

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

        if (currentQueue.queuePos > args[0])
        {
            currentQueue.queuePos--;
        }
        message.channel.send(`Removed Track ${args[0]}: ${currentQueue.songList[args[0]].title} [${am.ConvertSecToFormat(currentQueue.songList[args[0]].duration)}]`)
        currentQueue.songList.splice(parseInt(args[0]) - 1, 1);
        
    }
};
