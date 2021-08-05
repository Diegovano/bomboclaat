'use strict';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'bg',
  description: 'Self encouragement!',
  args: null,
  usage: null,
  dmCompatible: true,
  voiceConnection: false,
  textBound: false,
  async execute (message, _args) {
    switch (message.author.id) {
      case '620196939572576258': message.channel.send('We don\'t care about your opinion Hugo.'); break; // PBS
      case '244920561443012608': message.channel.send('En effet, c\'est toi le moins beau du monde entier'); break; // Hectah
      case '795261511647100968': message.channel.send('Puta Troya de Mierda'); break; // Gab
      case '578050897092018196': message.channel.send('poooooop'); break; // Remy
      case '410174833154850816': message.channel.send('t pas cool mais la Picardie ce l\'est'); break;// Clovis
      default: message.channel.send('Decidément.');
    }
  }
};
