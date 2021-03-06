'use strict';

const packageObject = require('../package.json');
const l = require('../log.js');

module.exports = {
  name: 'version',
  aliases: ['ver'],
  description: 'Display bomoclaat\'s version.',
  dmCompatible: true,
  async execute (message, _args) {
    l.log(`Bomboclaat version ${packageObject.version}`);
    message.channel.send(`Bomboclaat version ${packageObject.version}`);
  }
};
