'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.Config = void 0;
const fs = __importStar(require("fs"));
const path_1 = require("path");
const log_1 = require("./log");
const chokidar_1 = require("chokidar");
const index_1 = require("./index");
const package_json_1 = require("../package.json");
const types_1 = require("./types");
const configFolderPath = (0, path_1.join)('.', 'config');
const configFilePath = (0, path_1.join)(configFolderPath, 'config.json');
const emptyJSONError = Error('JSON template read as empty!');
const CONFIG_VERSION = '2';
function isNodeError(error) {
    return error instanceof Error;
}
/**
 * template to create new, bare config file.
 */
const configTemplate = { createdAtVersion: package_json_1.version, configVersion: CONFIG_VERSION, config: new Map() };
/**
 * Serialise JS map objects.
 */
function replacer(_key, value) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries())
        };
    }
    else
        return value;
}
/**
 * Deserialise JS map objects for use.
 */
function reviver(_key, value) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map')
            return new Map(value.value);
    }
    return value;
}
/**
 * Handles all loading loading and access operations of configuration.
 */
class Config {
    // private configObjectsMap: Map<string, configObjectType>;
    constructor() {
        const configTemplateString = JSON.stringify(configTemplate, replacer, 4);
        let data = '';
        try {
            data = fs.readFileSync(configFilePath, 'utf8');
        }
        catch (err) {
            try {
                fs.mkdirSync(configFolderPath);
                if (configTemplateString === '')
                    throw emptyJSONError; // should never write empty
                fs.writeFileSync(configFilePath, configTemplateString, { flag: 'wx' });
            }
            catch (err) {
                if (err instanceof Error && isNodeError(err)) {
                    if (err.code === 'EEXIST') {
                        if (configTemplateString === '')
                            throw emptyJSONError; // should never write empty
                        fs.writeFileSync(configFilePath, configTemplateString, { flag: 'wx' });
                    }
                    else {
                        err.message = `WARNING: Cannot create config file! ${err.message}`;
                        (0, log_1.logError)(err);
                    }
                }
            }
            try {
                data = fs.readFileSync(configFilePath, 'utf8');
            }
            catch (err) {
                if (err instanceof Error) {
                    err.message = `WARNING: Cannot read config file! ${err.message}`;
                    (0, log_1.logError)(err);
                }
                else
                    (0, log_1.logError)(Error('WARNING: Logging non-error typed error!'));
            }
        }
        if (data === '') {
            try {
                data = configTemplateString;
                fs.writeFileSync(configFilePath, configTemplateString);
                (0, log_1.log)('Reset config file');
            }
            catch (err) {
                if (err instanceof Error) {
                    err.message = `WARNING: Cannot reset config file to template! ${err.message}`;
                    (0, log_1.logError)(err);
                }
                else
                    (0, log_1.logError)(Error('WARNING: Logging non-error typed error!'));
            }
        }
        try {
            this.configObject = JSON.parse(data, reviver);
            // this.configObjectsMap = this.configObject.config;
            if (!this.configObject.configVersion)
                throw Error('Incompatible config version detected! Cannot automatically update, please delete config or manually update it to latest standards!');
            else if (parseInt(this.configObject.configVersion) < parseInt(CONFIG_VERSION))
                (0, log_1.log)('Old config version detected');
            (0, chokidar_1.watch)(configFilePath, { persistent: false })
                .on('change', _path => {
                (0, types_1.wait)(500).then(() => this.refreshConfig()).catch(err => {
                    err.message = `WARNING: Unable to automatically refresh config.json! ${err.message}`;
                    (0, log_1.logError)(err);
                });
            });
        }
        catch (err) {
            if (err instanceof Error) {
                err.message = `WARNING: Cannot parse JSON info while creating config object! ${err.message}`;
                (0, log_1.logError)(err);
                throw err;
            }
            else {
                (0, log_1.logError)(Error('WARNING: Logging non-error typed error!'));
                throw Error('WARNING: Logging non-error typed error!');
            }
        }
    }
    writeToJSON() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const serialised = JSON.stringify(this.configObject, replacer, 2);
                if (serialised === '')
                    throw emptyJSONError; // shouldnt write empty
                fs.writeFile(configFilePath, serialised, (err) => {
                    if (err) {
                        err.message = `WARNING: Unable to update config file! ${err.message}`;
                        (0, log_1.logError)(err);
                        return reject(err);
                    }
                    else
                        resolve();
                });
            });
        });
    }
    refreshConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                read().then((data) => {
                    try {
                        this.configObject = JSON.parse(data, reviver);
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            if (data !== '')
                                err.message += `\n\nRead data was:\n${data}`; // temporary debugging code
                            else
                                err.message += 'No data read!';
                            reject(err);
                        }
                        reject(Error('WARNING: Logging non-error typed error!'));
                    }
                    resolve();
                });
            });
        });
    }
    /**
     * Get the config for the current guild in object form.
     * @param guild Guild whose config will be fetched
     */
    get(guild) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.configObject === null)
                    return reject(Error('configObject invalid!'));
                // if (!this.configObjectsMap) return resolve(null);
                const guildConfigObject = this.configObject.config.get(guild.id);
                if (guildConfigObject === undefined) {
                    const newConfigObject = {
                        guildName: guild.name,
                        autoAccent: false,
                        prefix: index_1.DEFAULT_PREFIX,
                        accents: new Map(),
                        botChannels: new Map()
                    };
                    this.configObject.config.set(guild.id, newConfigObject);
                    return this.writeToJSON().then(() => resolve(newConfigObject), err => reject(err));
                }
                else if (guildConfigObject) {
                    return resolve(guildConfigObject);
                }
                else {
                    (0, log_1.logError)(Error('Guild id doesn\'t match user\'s guild id!'));
                    resolve(null);
                }
            });
        });
    }
    accentUser(message, accent, overwrite = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!message.guild)
                    return reject(Error('Cannot accent non-guild user!'));
                const objectHandle = this.configObject.config.get(message.guild.id);
                const accentHandle = objectHandle === null || objectHandle === void 0 ? void 0 : objectHandle.accents.get(message.author.id);
                if (message.channel.type !== 'GUILD_TEXT')
                    return reject(Error('Cannot accent non-guild user!'));
                if (!this.configObject)
                    return reject(Error('configObject invalid!'));
                if (!objectHandle)
                    return reject(Error('Guild is not initialised!'));
                const username = `${message.author.tag}`;
                let prevAccent;
                if (!accentHandle)
                    objectHandle.accents.set(message.author.id, { user: username, accent: accent });
                else {
                    prevAccent = accentHandle.accent;
                    if (overwrite)
                        accentHandle.accent = accent;
                }
                this.writeToJSON().then(() => {
                    if (overwrite)
                        return resolve(`Changed accent to ${accent}!`);
                    else
                        return resolve(null);
                }, err => {
                    if (accentHandle)
                        accentHandle.accent = prevAccent;
                    return reject(err);
                });
            });
        });
    }
}
exports.Config = Config;
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
function read() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            fs.readFile(configFilePath, 'utf8', (err, data) => {
                if (err) {
                    err.message = `WARNING: Unable to read config files! ${err.message}`;
                    reject(err);
                    // createConfigDir().then(() => resolve(read())).catch(err => {
                    //   err.message = `WARNING: Unable to create config files! ${err.message}`;
                    //   logError(err);
                    //   reject(err);
                    // });
                }
                else
                    resolve(data);
            });
        });
    });
}
exports.config = new Config();
//# sourceMappingURL=configFiles.js.map