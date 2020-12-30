'use strict';

const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports = {
    name: `move`,
    description: `Moves a song to a certain position in the queue`,
    args: true,
    usage: `<song position> <wanted position>`,
    voiceConnection: true,
    async execute(message, args)
    {
        const currentQueue = am.getQueue(message);

        currentQueue.move(args[0] - 1, args[1] - 1).then( msg =>
            {
                if (msg) message.channel.send(msg);
            }, err =>
            {
                err.message = `WARNING: Cannot move tracks! ${err.message}`;
                l.logError(err);
                message.channel.send(`Cannot move track!`);
            });
    }
};
