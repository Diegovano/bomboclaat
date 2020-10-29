module.exports = 
{
    name: `volume`,
    aliases: [`Changed the volume to 10.`],
    execute(message, prefix)
    {
        if (count===6)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};