const am = require(`../audio.js`);
const Discord = require(`discord.js`);

module.exports = {
    name : `nowplaying`,
    description : `shows the banger currently playing`,
    aliases : [`np`, `current`, `playing`],
    execute(message, args){
        var currentQueue = am.getQueue(message);

        try {
            const npEmbed = new Discord.MessageEmbed()
                                 .setColor(`#ff0000`)
                                 .setTitle(`Now Playing`)
                                 .setURL(currentQueue.getSong().sourceLink)
                                 .setAuthor('Bomborastclaat', `https://i.pinimg.com/originals/d1/91/86/d191860d0ab59a74fb57de99b5fb2d80.jpg`)
                                 .addFields(
                                     {name : `Song title`, value : currentQueue.getSong().title},
                                     {name : `Author`, value : currentQueue.getSong().author},
                                     {name : `Requested by:`, value : currentQueue.getSong().requestedBy},
                                     {name : `Video link`, value : currentQueue.getSong().sourceLink}
                                 )
                                 .setImage(currentQueue.getSong().icon)
                                 .setTimestamp()
            message.channel.send(npEmbed)
        } catch (err) {
            message.channel.send(`Nada is playing my brudda`);
        }
    }
}
