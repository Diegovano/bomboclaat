'use strict';

module.exports = {
  name: 'bg',
  description: 'Self encouragement!',
  async execute (message, _args) {
    switch (message.author.id) {
      case '620196939572576258': return message.channel.send('We don\'t care about your opinion Hugo.'); // PBS
      case '244920561443012608': return message.channel.send('En effet, c\'est toi le plus beau du monde entier'); // Hectah
      case '795261511647100968': return message.channel.send('Puta Troya de Mierda'); // Gab
      case '578050897092018196': return message.channel.send('poooooop'); // Remy
      case '410174833154850816': return message.channel.send('t pas cool mais la Picardie ce l\'est'); // Clovis
      default: return message.channel.send('Decidément.');
    }
  }
};
