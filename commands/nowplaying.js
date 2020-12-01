'use strict';

const am = require(`../audio.js`);

module.exports =
{
    name: `nowplaying`,
    description: `shows the banger currently playing`,
    aliases: [`np`, `current`, `playing`],
    guildOnly: true,
    async execute(message, _args)
    {
        const currentQueue = am.getQueue(message);

        message.client.commands.get(`songinfo`).execute(message, currentQueue.queuePos);
    }
};