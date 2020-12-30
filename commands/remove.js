'use strict';

const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports = {
    name: `remove`,
    alisases: [`r`],
    description: `Gets rid of a song in the queue`,
    usage: `<song position>`,
    args: true,
    guildOnly: true,
    voiceConnection: true,
    async execute(message, args)
    {
        const currentQueue = am.getQueue(message);

        if (message.channel.id !== currentQueue.textChannel.id)
            return message.channel.send(`Bot is bound to ${currentQueue.textChannel.name}, please use this channel to remove tracks!`);

        currentQueue.remove(parseInt(args[0]) - 1).then( msg =>
            {
                message.channel.send(msg);
            }, err =>
            {
                message.channel.send(`Error removing track! Is song position in range? `);
                err.message = `WARNING: Error removing track ${err.message}`;
                l.logError(err);
            });
    }
};
