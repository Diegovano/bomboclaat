module.exports = 
{
    name: `play`,
    aliases: ['Now playing ***Coconut Mall - Mario Kart Wii EARRAPE***, requested by **Tester**'],
    execute(message, prefix)
    {
        if (tests[count]===`queue`)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};