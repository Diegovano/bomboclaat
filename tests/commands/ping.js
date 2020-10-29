module.exports = 
{
    name: `ping`,
    aliases: [`Pong!`],
    execute(message, prefix)
    {
        if (count===8)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};