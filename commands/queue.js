'use strict';

const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports =
{
    name: `queue`,
    aliases: [`q`, `list`, `next`, `playlist`],
    description: `Print a list of the songs added to the queue since the bot joined the voice channel.`,
    guildOnly: true,
    execute(message, _args)
    {
        const currentQueue = am.getQueue(message);

        if (message.channel.id !== currentQueue.textChannel.id)
            return message.channel.send(`Bot is bound to ${this.textChannel.name}, please use this channel to see the queue!`);

        am.getQueue(message).getQueueMessage().then( messageContent =>
            {
                for (let i = 0; i < messageContent.length; i++)
                {
                    message.channel.send(messageContent[i]).catch( err =>
                        {
                            message.channel.send(`Unable to send queue message`);
                            err.message = `WARNING: Cannot send queue embeds! ${err.message}`;
                            l.logError(err);
                        });
                }
            }, err =>
            {
                message.channel.send(`Unable to get queue message`);
                err.message = `WARNING: Cannot get queue message! ${err.message}`;
                l.logError(err);
            });

    }
};
