const am = require(`../audio.js`);

module.exports = 
{
    name: `unpause`,
    aliases: [`go`],
    desciption: `Unpause the player`,
    guidOnly: true,
    execute(message, args)
    {
        var currentQueue = am.getQueue(message);

        try 
        {
            currentQueue.unpause();
        } 
        catch (error) 
        {
            message.channel.send(`Unable to unpause the player! Is anything in queue? ${error}`);
        }

        return;
    }
};