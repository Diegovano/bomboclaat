'use strict';

const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports = {
    name : `volume`,
    aliases: [`v`, `vol`],
    description : 'earrape',
    args: true,
    usage: `<volume level>`,
    guildOnly: true,
    voiceConnection: true,
    async execute(message, args)
    {
        if (parseFloat(args) != args) return message.channel.send(`Please provide a number!`);

        const currentQueue = am.getQueue(message);

        try
        {
            currentQueue.setVolume(args[0]);
        }
        catch (error)
        {
            error.message = `What u trying to change the volume of idiot? ${error.message}`;
            l.logError(error);
        }

        return message.channel.send(`Changed the volume to ${args[0]}.`);
    }
};
