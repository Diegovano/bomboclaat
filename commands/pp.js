'use strict';

module.exports =
{
    name: `pp`,
    aliases: [`dick`, `penis`, `hector`],
    description: `Reveals the true size of people's ╭∩╮`,
    execute(message, args)
    {
        if (message.author.username === `Terminator00702` || message.author.username === `Bobnotarobot`)
        {
            return message.channel.send(`${message.author.username}'s cock size is:\n8¬ 1 inch! WOW`);
        }
        
        const penis = [`8`];
        let iter = 0;
        for (; iter < Math.floor(Math.random() * 50); iter++) penis.push(`=`);

        return message.channel.send(`${message.author.username}'s cock size is:\n${penis.toString().replace(/,/gi, "")}D    ${iter} inches!`);
    }
};