'use strict'

const am = require(`../audio.js`);

module.exports =
    {
        name: `move`,
        description: `Moves a song to a certain position in the queue`,
        usage: `[song position] [wanted position]`,
        execute(message, args)
        {
            const currentQueue = am.getQueue(message);

            [currentQueue.songList[args[0] - 1], currentQueue.songList[args[1] - 1]] = [currentQueue.songList[args[1] - 1], currentQueue.songList[args[0] - 1]]
        }
    };
