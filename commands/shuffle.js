const am = require(`../audio.js`);

module.exports = {
    name: `shuffle`,
    description: `figure it out yourself its not rocket science`,
    async execute(message, _args)
    {
        const currentQueue = am.getQueue(message);

        function shuffle(array) 
        {
            let currentIndex = array.length, temporaryValue, randomIndex;

            while (0 !== currentIndex) 
            {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        }

        const maybe = shuffle(currentQueue.songList.slice(currentQueue.queuePos));

        for (let i = 0; i < maybe.length + 1; i++)
        {
            currentQueue.songList[currentQueue.songList.length - i] = maybe[maybe.length - i];
        }
    }
};
