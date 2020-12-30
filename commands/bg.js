'use strict';

module.exports = {
  name: 'bg',
  description: 'Self encouragement!',
  async execute (message, _args) {
    switch (message.author.username) {
      case 'Powered By Salt': return message.channel.send('We don\'t care about your opinion Hugo.');
      case 'Jesus de 89': return message.channel.send('En effet, c\'est toi le plus beau du monde entier');
      case 'Gabriele': return message.channel.send('Puta Troya de Mierda');
    }

    return message.channel.send('Decidément.');
  }
};
