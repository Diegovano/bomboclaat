'use strict';

const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports =
{
    name: `skip`,
    aliases: [`s`, `next`],
    description: `Skip the current track.`,
    guildOnly: true,
    execute(message, args)
    {
        const currentQueue = am.getQueue(message);

        if (message && message.channel.id !== this.textChannel.id)
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to skip!`);

        currentQueue.skip().then( msg =>
            {
                if (msg) message.channel.send(msg);
            }, err =>
            {
                message.channel.send(`Unable to skip track!`);
                l.logError(err);
            });
    }
};