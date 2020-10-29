'use strict';

const packageObject = require(`../package.json`);
const l = require(`../log.js`);

module.exports = 
{
    name: `version`,
    aliases: [`ver`, `v`],
    description: `Display bomoclaat's version.`,
    execute(message, args)
    {
        l.log(`Bomboclaat version ${packageObject.version}`);
        message.channel.send(`Bomboclaat version ${packageObject.version}`);
    }
};