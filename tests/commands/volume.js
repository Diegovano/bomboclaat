module.exports = 
{
    name: `volume`,
    aliases: [`Changed the volume to 10.`],
    execute(message, prefix)
    {
        if (tests[count]===`leave`)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};