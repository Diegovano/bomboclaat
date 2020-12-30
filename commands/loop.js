'use strict';

const am = require(`../audio.js`);

module.exports = {
    name: `loop`,
    aliases: [`l`, `replay`, `again`],
    description: `Toggle between no loop, song loop and queue loop`,
    guildOnly: true,
    voiceConnection: true,
    async execute(message, _args)
    {
        const currentQueue = am.getQueue(message);

        if (!currentQueue.loopSong && !currentQueue.loopQueue)
        {
            currentQueue.toggleSongLoop();
            message.channel.send(`Now looping this song!`);
        }
        else if (currentQueue.loopSong)
        {
            currentQueue.toggleSongLoop();
            currentQueue.toggleQueueLoop();
            message.channel.send(`Now looping the queue!`);
        }
        else
        {
            currentQueue.toggleQueueLoop();
            message.channel.send(`Looping disabled!`);
        }
    }
};
