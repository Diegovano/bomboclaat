'use strict';

const am = require(`../audio.js`);

module.exports =
{
    name: `pause`,
    aliases: [`stop`],
    description: `Pause the current song.`,
    guildOnly: true,
    async execute(message, _args)
    {
        const currentQueue = am.getQueue(message);

        try
        {
            currentQueue.pause();
        } 
        catch (error) 
        {
            message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
        }
    }
};