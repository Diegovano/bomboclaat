'use strict';

const am = require(`../audio.js`);
const Discord = require(`discord.js`);

module.exports = {
    name : `nowplaying`,
    description : `shows the banger currently playing`,
    aliases : [`np`, `current`, `playing`],
    execute(message, args)
    {
        const currentQueue = am.getQueue(message);

        try 
        {
            const npEmbed = new Discord.MessageEmbed()
                                 .setColor(`#ff0000`)
                                 .setTitle(`Now Playing`)
                                 .setURL(currentQueue.getSong().sourceLink)
                                 .setAuthor('Bomborastclaat', message.client.user.displayAvatarURL())
                                 .addFields(
                                     { name : `Song title`, value : `[${currentQueue.getSong().title}](${currentQueue.getSong().sourceLink})` },
                                     { name : `Author`, value : currentQueue.getSong().author },
                                     { name : `Requested by:`, value : currentQueue.getSong().requestedBy }
                                 )
                                 .setImage(currentQueue.getSong().icon)
                                 .setTimestamp();
            message.channel.send(npEmbed);
        } 
        catch (err) 
        {
            message.channel.send(`Nada is playing my brudda`);
        }
    }
};
