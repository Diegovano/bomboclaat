'use strict';

const am = require(`../audio.js`);

module.exports = {
    name: `join`,
    aliases: [`j`, `hello`, `hi`],
    description: `Tell the bot to join your voice channel.`,
    guildOnly: true,
    async execute(message, _args)
    {
        if (!message.member.voice.channel)
        {
            return message.reply(`You aren't in a Voice Channel! Bot cannot connect!`);
        }

        const currentQueue = am.getQueue(message);
        currentQueue.play();
    }
};
