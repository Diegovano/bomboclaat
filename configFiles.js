'use strict';

const fs = require('fs');
const path = require('path');
const l = require('./log.js');

const configFolderPath = path.join('.', 'config');
const configFilePath = path.join(configFolderPath, 'config.json');

const configTemplate =
  {};

// noinspection ExceptionCaughtLocallyJS
class Config {
  constructor () {
    this.configObject = null;
    this.configChanged = false;
    this.configUpdater = setInterval(
      (function (self) {
        return function () {
          self.writeToJSON(); // Allows function to be called from Config context.
        };
      })(this),
      300000
    ); // Update the "RAM" version of the config to file.
    const configTemplateString = JSON.stringify(configTemplate, null, 4);

    let data;
    try {
      data = fs.readFileSync(configFilePath, 'utf8');
    } catch (err) {
      try {
        fs.mkdirSync(configFolderPath);
        if (configTemplateString === '') throw Error('INVESTIGATE'); // should never write empty
        fs.writeFileSync(configFilePath, configTemplateString, { flag: 'wx' });
      } catch (err) {
        if (err.code === 'EEXIST') {
          if (configTemplateString === '') throw Error('INVESTIGATE'); // should never write empty
          fs.writeFileSync(configFilePath, configTemplateString, { flag: 'wx' });
        } else {
          err.message = `WARNING: Cannot create config file! ${err.message}`;
          l.logError(err);
        }
      }

      try {
        data = fs.readFileSync(configFilePath, 'utf8');
      } catch (err) {
        err.message = `WARNING: Cannot read config file! ${err.message}`;
        l.logError(err);
      }
    }

    if (data === '') {
      try {
        data = configTemplateString;
        fs.writeFileSync(configFilePath, configTemplateString);
        l.log('Reset config file');
      } catch (err) {
        err.message = `WARNING: Cannot reset config file to template! ${err.message}`;
        l.logError(err);
      }
    }

    try {
      this.configObject = JSON.parse(data);
    } catch (err) {
      err.message = `WARNING: Cannot parse JSON info while creating config object! ${err.message}`;
      l.logError(err);
    }
  }

  writeToJSON () {
    if (this.configChanged === true) {
      if (JSON.stringify(this.configObject, null, 4) === '') throw Error('INVESTIGATE'); // shouldn't write empty
      fs.writeFile(configFilePath, JSON.stringify(this.configObject, null, 4), (err) => {
        if (err) {
          err.message = `WARNING: Unable to update config file! ${err.message}`;
          l.logError(err);
        }
      });
      this.configChanged = false;
    }
  }

  async initGuild (message) {
    return new Promise((resolve, reject) => {
      if (message.channel.type !== 'text') return reject(Error('Message is from non-guild user!'));
      if (this.configObject === null) return reject(Error('configObject invalid!'));

      // const index = this.configObject.guilds.findIndex(element => element.id === message.guild.id);
      if (this.configObject[message.guild.id] === undefined) {
        // this.configObject.guilds.push({ id: message.guild.id, accents: [ ], prefix: `|`, botChannels: [ ]});
        this.configObject[message.guild.id] = { autoAccent: false, prefix: '|', accents: {}, botChannels: {} };
        this.configChanged = true;
        return resolve();
      } else {
        if (this.configObject[message.guild.id]) return resolve();
        else return reject(Error('Guild id doesn\'t match user\'s guild id!'));
      }
    });
  }

  async initUser (message) {
    return new Promise((resolve, reject) => {
      const objectHandle = this.configObject[message.guild.id];
      if (message.channel.type !== 'text') return reject(Error('Cannot init non-guild user!'));
      if (this.configObject === null) return reject(Error('configObject invalid!'));
      if (objectHandle === undefined) return reject(Error('Guild is not initialised!'));

      const username = `${message.author.username}#${message.author.discriminator}`;
      if (objectHandle.accents[message.author.id] === undefined) {
        objectHandle.accents[message.author.id] = { user: username, accent: 'none', xp: 0, level: 0 };
        this.configChanged = true;
      } else if (objectHandle.accents[message.author.id].xp === undefined) {
        // Update to new config version.
        objectHandle.accents[message.author.id].xp = 0;
        objectHandle.accents[message.author.id].level = 0;
        this.configChanged = true;
      }
      return resolve();
    });
  }
}

exports.config = new Config();
