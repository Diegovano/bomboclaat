'use strict';

const fs = require(`fs`);
const l = require(`../log.js`);

module.exports = {
    name: `insult`,
    description: `Provide the user with a searing insult.`,
    async execute(message, _args)
    {
        let insults;
        try
        {
            insults = fs.readFileSync(`../slurs.txt`, `utf8`, function(err, data) { } );
        }
        catch
        {
            l.log(`"slurs.txt" could not be read or does not exist. Using default insults.`);
            insults = [`you burnt piece of celery.`, `you cunt.`, `you SIMP.`, `you Smol BRaIn.`, `you idiot sandwich.`, `you GAB!`];
        }
        
        message.channel.send(`Fuck you, ${message.author.username}, ${insults[Math.floor(Math.random() * insults.length)]}`);
    }
};
