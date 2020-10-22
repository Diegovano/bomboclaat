const am = require(`../audio.js`);
const l = require(`../log.js`);

module.exports = {
    name : `volume`,
    aliases: [`vol`],
    description : 'earrape',
    execute(message, args)
    {
        var currentQueue = am.getQueue(message);

        try
        {
            currentQueue.setVolume(args[0]);
        }
        catch (error)
        {
            l.logError(`What u trying to change the volume of idiot ${error}`);
        }

        return;
    }
};
