'use strict';

module.exports =
{
    name: `ping`,
    description: `Ping... Pong!`,
    args: false,
    execute(message, args)
    {
        message.channel.send(`Pong!`);
    }
};