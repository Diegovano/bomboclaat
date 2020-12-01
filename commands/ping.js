'use strict';

module.exports = {
    name: `ping`,
    description: `Ping... Pong!`,
    args: false,
    async execute(message, _args)
    {
        message.channel.send(`Pong!`);
    }
};
