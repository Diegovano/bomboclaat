const am = require(`../audio.js`);

module.exports =
    {
        name: `seek`,
        description: `Seeks innit`,
        async execute(message, args)
        {
            var currentQueue = am.getQueue(message);
            currentQueue.seek(args[0]);
        }
    }
