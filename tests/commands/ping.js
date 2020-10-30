module.exports = 
{
    name: `ping`,
    aliases: [`Pong!`],
    execute(message, prefix)
    {
        if (tests[count]===`botquit`)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};