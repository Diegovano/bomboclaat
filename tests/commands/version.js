module.exports = 
{
    name: `version`,
    aliases: [`Bomboclaat version 2.0.0`],
    execute(message, prefix)
    {
        if (count===1)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};