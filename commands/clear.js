'use strict';

const am = require(`../audio.js`);

module.exports = 
{
    name: `clear`,
    aliases: [`empty`, `reset`],
    description: `Clear all tracks from the current queue except the current track.`,
    guildOnly: true,
    execute(message, args = am.getQueue(message).queuePos)
    {
        const currentQueue = am.getQueue(message);

        currentQueue.clear();
        // currentQueue.pause();
        // am.deleteQueue(message);

        // message.client.commands.get(`leave`).execute(message, `silent`);
    }
};