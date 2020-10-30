module.exports = 
{
    name: `embed`,
    aliases: [``],
    execute(message, prefix)    // Check what embed it is
    {
        if (message.embeds[0].toJSON().title==="Here's a list of all commands:" && tests[count]===`bg`)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
        else if (message.embeds[0].toJSON().title==="Queue" && tests[count]===`volume 10`)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};
