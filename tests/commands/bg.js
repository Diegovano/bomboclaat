const l = require(`../../log.js`);

module.exports = 
{
    name: `bg`,
    aliases: [`Decidément.`],
    execute(message, prefix)
    {
        if (count===3)
        {
            message.client.channels.cache.get("770990593181483042").join().then(connection=>
                {
                    message.channel.send(prefix + tests[count]);
                    count += 1;
                });
        }
    }
};