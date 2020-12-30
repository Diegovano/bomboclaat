'use strict';

const conf = require(`../configFiles.js`);
const l = require(`../log.js`);

module.exports = {
    name: `prefix`,
    description: `Change the bot's prefix for this server`,
    args: true,
    usage: `<new prefix>`,
    guildOnly: true,
    execute(message, args)
    {
        const objectHandle = conf.config.configObject[message.guild.id];
        const prevPrefix = objectHandle.prefix;

        if (!objectHandle) throw Error(`Guild config not initialised!`);

        objectHandle.prefix = args[0];
        conf.config.writeToJSON().then( () =>
            {
                message.channel.send(`Prefix changed to '${objectHandle.prefix}'`);
            }, err =>
            {
                objectHandle.prefix = prevPrefix; // if unable to write reset to old prefix
                err.message = `WARNING: Unable to update config file! ${err.message}`;
                l.logError(err);
            });
    }
};
