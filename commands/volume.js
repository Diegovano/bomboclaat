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
    async execute(message, args)
    {
        if (!message.member.voice.channel) return message.reply(`please join a voice channel to change volume!`);
        if (!(message.member.voice.channel.permissionsFor(message.client.user).has(`CONNECT`)) ||
        !(message.member.voice.channel.permissionsFor(message.client.user).has(`SPEAK`)))
            return message.channel.send(`I need permissions to join and speak in your voice channel!`);

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
