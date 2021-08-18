'use strict';

import * as fs from 'fs';
import * as Discord from 'discord.js';
import { join } from 'path';
import { log, logError } from './log';
import { watch } from 'chokidar';
import { DEFAULT_PREFIX } from './index';
import { version } from '../package.json';
import { VoiceCInteraction } from './types';

const configFolderPath = join('.', 'config');
const configFilePath = join(configFolderPath, 'config.json');

const emptyJSONError = Error('JSON template read as empty!');

const CONFIG_VERSION = '2';

/**
 * Structure of a bot channel
 */
interface botChannelObject {
  name: string,
  topic: string | null
}

/**
 * Structure of a guild's configuration
 */
export interface configObjectType {
    guildName: string;
    autoAccent: boolean;
    prefix: string;
    accents: Map<string, { user: string; accent: string }>;
    botChannels: Map<string, botChannelObject>;
}

/**
 * template to create new, bare config file.
 */
const configTemplate = { createdAtVersion: version, configVersion: CONFIG_VERSION, config: new Map<string, configObjectType>() };

/**
 * Serialise JS map objects.
 */
function replacer<K, V> (_key: K, value: V) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries())
    };
  } else return value;
}

/**
 * Deserialise JS map objects for use.
 */
function reviver<K, V> (_key: K, value: { dataType: string, value: [K, V][] }) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') return new Map(value.value);
  }
  return value;
}

/**
 * Handles all loading loading and access operations of configuration.
 */
export class Config {
  private configObject: { createdAtVersion: string, configVersion: string, config: Map<string, configObjectType> };
  // private configObjectsMap: Map<string, configObjectType>;
  constructor () {
    const configTemplateString = JSON.stringify(configTemplate, replacer, 4);

    let data = '';
    try {
      data = fs.readFileSync(configFilePath, 'utf8');
    } catch (err) {
      try {
        fs.mkdirSync(configFolderPath);
        if (configTemplateString === '') throw emptyJSONError; // should never write empty
        fs.writeFileSync(configFilePath, configTemplateString, { flag: 'wx' });
      } catch (err) {
        if (err.code === 'EEXIST') {
          if (configTemplateString === '') throw emptyJSONError; // should never write empty
          fs.writeFileSync(configFilePath, configTemplateString, { flag: 'wx' });
        } else {
          err.message = `WARNING: Cannot create config file! ${err.message}`;
          logError(err);
        }
      }

      try {
        data = fs.readFileSync(configFilePath, 'utf8');
      } catch (err) {
        err.message = `WARNING: Cannot read config file! ${err.message}`;
        logError(err);
      }
    }

    if (data === '') {
      try {
        data = configTemplateString;
        fs.writeFileSync(configFilePath, configTemplateString);
        log('Reset config file');
      } catch (err) {
        err.message = `WARNING: Cannot reset config file to template! ${err.message}`;
        logError(err);
      }
    }

    try {
      this.configObject = JSON.parse(data, reviver);
      // this.configObjectsMap = this.configObject.config;
      if (!this.configObject.configVersion) throw Error('Incompatible config version detected! Cannot automatically update, please delete config or manually update it to latest standards!');
      else if (parseInt(this.configObject.configVersion) < parseInt(CONFIG_VERSION)) log('Old config version detected');
      watch(configFilePath, { persistent: false })
        .on('change', _path => {
          setTimeout(() => {
            this.refreshConfig().catch(err => {
              err.message = `WARNING: Unable to automatically refresh config.json! ${err.message}`;
              logError(err);
            });
          }, 500);
        });
    } catch (err) {
      err.message = `WARNING: Cannot parse JSON info while creating config object! ${err.message}`;
      logError(err);
      throw err;
    }
  }

  async writeToJSON () : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const serialised = JSON.stringify(this.configObject, replacer, 2);
      if (serialised === '') throw emptyJSONError; // shouldn't write empty
      fs.writeFile(configFilePath, serialised, (err) => {
        if (err) {
          err.message = `WARNING: Unable to update config file! ${err.message}`;
          logError(err);
          return reject(err);
        } else resolve();
      });
    });
  }

  async refreshConfig () : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      read().then((data) => {
        try {
          this.configObject = JSON.parse(data, reviver);
        } catch (err) {
          if (data !== '') err.message += `\n\nRead data was:\n${data}`; // temporary debugging code
          else err.message += 'No data read!';
          reject(err);
        }

        resolve();
      });
    });
  }

  /**
   * Get the config for the current guild in object form.
   * @param guild Guild whose config will be fetched
   */

  async get (guild: Discord.Guild) : Promise<configObjectType | null> {
    return new Promise<configObjectType | null>((resolve, reject) => {
      if (this.configObject === null) return reject(Error('configObject invalid!'));
      // if (!this.configObjectsMap) return resolve(null);

      const guildConfigObject = this.configObject.config.get(guild.id);

      if (guildConfigObject === undefined) {
        const newConfigObject: configObjectType = {
          guildName: guild.name,
          autoAccent: false,
          prefix: DEFAULT_PREFIX,
          accents: new Map(),
          botChannels: new Map()
        };

        this.configObject.config.set(guild.id, newConfigObject);
        return this.writeToJSON().then(() => resolve(newConfigObject), err => reject(err));
      } else if (guildConfigObject) {
        return resolve(guildConfigObject);
      } else {
        logError(Error('Guild id doesn\'t match user\'s guild id!'));
        resolve(null);
      }
    });
  }

  async accentUser (interaction:VoiceCInteraction | Discord.Message, accent: string, overwrite = true) : Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
      if (interaction.guild) {
        const objectHandle = this.configObject.config.get(interaction.guild.id);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const accentHandle = objectHandle?.accents.get(interaction.user.id ?? interaction.author.id);
        if (!this.configObject) return reject(Error('configObject invalid!'));
        if (!objectHandle) return reject(Error('Guild is not initialised!'));

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const username = `${interaction.user.tag ?? interaction.author.tag}`;
        let prevAccent: string;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!accentHandle) objectHandle.accents.set(interaction.user.id ?? interaction.author.id, { user: username, accent: accent });
        else {
          prevAccent = accentHandle.accent;
          if (overwrite) accentHandle.accent = accent;
        }

        this.writeToJSON().then(() => {
          if (overwrite) return resolve(`Changed accent to ${accent}!`);
          else return resolve(null);
        }, err => {
          if (accentHandle) accentHandle.accent = prevAccent;
          return reject(err);
        });
      }
    });
  }
}

// async function createConfigDir () {
//   return new Promise<void>((resolve, reject) => {
//     fs.mkdir(configFolderPath, (err) => {
//       if (err && err.code !== 'EEXIST') {
//         return reject(err);
//       }

//       if (JSON.stringify(configTemplate, replacer, 4) === '') throw emptyJSONError;
//       fs.writeFile(configFilePath, JSON.stringify(configTemplate, replacer, 4), { flag: 'wx' }, (err) => {
//         if (err) {
//           return reject(err);
//         }

//         fs.access(configFilePath, fs.constants.R_OK | fs.constants.W_OK, (err) => {
//           if (err) return reject(err);
//           else return resolve();
//         });
//       });
//     }); // Callback hell-ish
//   });
// }
/**
 * If config is readable, then return contents, otherwise create config directory.
 */
async function read () {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(configFilePath, 'utf8', (err, data) => {
      if (err) {
        err.message = `WARNING: Unable to read config files! ${err.message}`;
        reject(err);
        // createConfigDir().then(() => resolve(read())).catch(err => {
        //   err.message = `WARNING: Unable to create config files! ${err.message}`;
        //   logError(err);
        //   reject(err);
        // });
      } else resolve(data);
    });
  });
}

export const config = new Config();
