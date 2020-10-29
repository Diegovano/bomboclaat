module.exports = 
{
    name: `test`,
    aliases: [``],
    execute(message, prefix)
    {
        if (count===2)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};