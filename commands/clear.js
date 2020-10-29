'use strict';

const am = require(`../audio.js`);

module.exports = 
{
    name: `clear`,
    aliases: [`empty`, `reset`],
    description: `Clear all tracks from the current queue. (Deletes the queue)`,
    guildOnly: true,
    execute(message, args)
    {
        const currentQueue = am.getQueue(message);
        currentQueue.pause();
        am.deleteQueue(message);

        message.client.commands.get(`leave`).execute(message, args);
    }
};