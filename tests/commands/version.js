module.exports = 
{
    name: `version`,
    aliases: [`Bomboclaat version 2.0.0`],
    execute(message, prefix)
    {
        if (tests[count]===`help`)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};