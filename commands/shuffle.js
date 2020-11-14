const am = require(`../audio.js`)

module.exports = {
    name: `shuffle`,
    description: `figure it out yourself its not rocket science`,
    execute(message, args){

        const currentQueue = am.getQueue(message);

        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            while (0 !== currentIndex) {

                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        }

        var maybe = shuffle(currentQueue.songList.slice(currentQueue.queuePos));

        for (let i = 0; i < maybe.length; i++){
            currentQueue.songList[currentQueue.songList.length - i] = maybe[maybe.length - i];
        }
    }
}
