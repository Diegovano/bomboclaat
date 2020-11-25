'use strict';

const am = require(`../audio.js`);
const play = require(`./play.js`);
const l = require(`../log.js`);

module.exports = 
{
    name: `playnext`,
    aliases: [`pn`, `next`],
    description: `Add a song to the queue that will play after the current one.`,
    guildOnly: true,
    args: true,
    usage: `<song name>`,
    execute(message, args)
    {
        if (!message.member.voice.channel) return message.reply(`please join a voice channel to queue songs!`);
        if (!(message.member.voice.channel.permissionsFor(message.client.user).has(`CONNECT`)) ||
        !(message.member.voice.channel.permissionsFor(message.client.user).has(`SPEAK`)))
            return message.channel.send(`I need permissions to join and speak in your voice channel!`);

        const currentQueue = am.getQueue(message);

        play.getSongObjects(message, args).then( async songs =>
            {
                if (songs.length === 1) currentQueue.add(songs[0], message, false, true).then( msg =>
                    {
                        if (msg) message.channel.send(msg);
                    }, err =>
                    {
                        message.channel.send(err.message);
                    });
                else
                {
                    for (let i = 0; i < songs.length; i++) 
                    {
                        await currentQueue.add(songs[i], message, true, true).then( msg =>
                            {
                                if (msg) message.channel.send(msg);
                            }, err =>
                            {
                                message.channel.send(err.message);
                            });
                    }
    
                    message.channel.send(`Added ${songs.length} songs to the queue!`);
                }
            },  err =>
            {
                err.message = `WARNING: Unable to get song information! ${err.message}`;
                l.logError(err);
            });
    }
};