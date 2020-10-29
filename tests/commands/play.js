module.exports = 
{
    name: `play`,
    aliases: ['Now playing ***Coconut Mall - Mario Kart Wii EARRAPE***, requested by **Tester**'],
    execute(message, prefix)
    {
        if (count===5)
        {
            message.channel.send(prefix + tests[count]);
            count += 1;
        }
    }
};