'use strict';

const am = require(`../audio.js`);

module.exports = {
    name: `switch`,
    description: `The bot will join the voice channel of the requestor.`,
    guildOnly: true,
    async execute(message, _args)
    {
        if (!message.member.voice.channel) return message.reply(`please join a voice channel to call the bot!`);
        if (!(message.member.voice.channel.permissionsFor(message.client.user).has(`CONNECT`)) ||
            !(message.member.voice.channel.permissionsFor(message.client.user).has(`SPEAK`)))
            return message.channel.send(`I need permissions to join and speak in your voice channel!`);

        const currentQueue = am.getQueue(message);

        currentQueue.voiceChannel = message.member.voice.channel;
        if (currentQueue.currentSong) currentQueue.play(currentQueue.timestamp);
    }
};
