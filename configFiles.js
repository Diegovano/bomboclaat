`use strict`;

const fs = require(`fs`);
const path = require(`path`);
const l = require(`./log.js`);

const configFolderPath = path.join(`.`, `config`);
const configFilePath = path.join(configFolderPath, `config.json`);

const configTemplate = 
{   
    
};

class config
{
    constructor()
    {
        this.configObject = null;
        const configTemplateString = JSON.stringify(configTemplate, null, 4);

        let data;
        try 
        {
            data = fs.readFileSync(configFilePath, `utf8`);
        }
        catch (err)
        {
            try 
            {
                fs.mkdirSync(configFolderPath);
                if (configTemplateString === ``) throw Error(`INVESTIGATE`); //should never write empty
                fs.writeFileSync(configFilePath, configTemplateString, { flag: `wx` } );
            }
            catch (err)
            {
                if (err.code === `EEXIST`)
                {
                    if (configTemplateString === ``) throw Error(`INVESTIGATE`); //should never write empty
                    fs.writeFileSync(configFilePath, configTemplateString, { flag: `wx` } );
                }
                
                else
                {
                    err.message = `WARNING: Cannot create config file! ${err.message}`;
                    l.logError(err);
                }
                
            }

            try
            {
                data = fs.readFileSync(configFilePath, `utf8`);
            }
            catch (err)
            {
                err.message = `WARNING: Cannot read config file! ${err.message}`;
                l.logError(err);
            }
        }

        if (data === ``)
        {
            try 
            {
                data = configTemplateString;
                fs.writeFileSync(configFilePath, configTemplateString);
                l.log(`Reset config file`);
            } 
            catch (err)
            {
                err.message = `WARNING: Cannot reset config file to template! ${err.message}`;
                l.logError(err);
            }
        }
        
        try 
        {
            this.configObject = JSON.parse(data);
            fs.watch(configFilePath, { persistent: false }, (eventType, _filename) => 
            {
                if (eventType === `change`)
                {
                    setTimeout(() => 
                    {    
                        this.refreshConfig().catch( err =>
                        {
                            err.message = `Unable to automatically refresh config.json! ${err.message}`;
                            l.logError(err);
                        });
                    }, 500);
                }
            });
        } 
        catch (err) 
        {
            err.message = `WARNING: Cannot parse JSON info while creating config object! ${err.message}`;
            l.logError(err);
        }
    }

    async writeToJSON()
    {
        return new Promise( (resolve, reject) =>
        {
            if (JSON.stringify(this.configObject, null, 4) === ``) throw Error(`INVESTIGATE`); // shouldnt write empty
            fs.writeFile(configFilePath, JSON.stringify(this.configObject, null, 4), (err) =>
            {
                if (err)
                {
                    err.message = `WARNING: Unable to update config file! ${err.message}`;
                    l.logError(err);
                    return reject(err);
                }

                resolve();
            });
        });
    }

    async refreshConfig()
    {
        return new Promise( (resolve, reject) =>
        {
            readConfig( (data) =>
            {
                try
                {
                    this.configObject = JSON.parse(data);
                }
                catch (err)
                {
                    reject(err);
                }

                resolve();
            });
        });
    }

    async initGuild(message)
    {
        return new Promise( (resolve, reject) =>
        {
            if (message.channel.type !== `text`) return reject(Error(`Message is from non-guild user!`));
            if (this.configObject === null) return reject(Error(`configObject invalid!`));

            // const index = this.configObject.guilds.findIndex(element => element.id === message.guild.id);
            if (this.configObject[message.guild.id] === undefined) 
            {
                // this.configObject.guilds.push({ id: message.guild.id, accents: [ ], prefix: `|`, botChannels: [ ]});
                this.configObject[message.guild.id] = { autoAccent: false, prefix: `|`, accents: { }, botChannels: [ ] };
                return this.writeToJSON().then( () => resolve(), err => reject(err));
            }
            else
            {
                if (this.configObject[message.guild.id]) return resolve();
                else reject(Error(`Guild id doesn't match user's guild id!`));
            }
        });
    }

    async accentUser(message, accent, overwrite = true)
    {
        return new Promise( (resolve, reject) =>
        {
            const objectHandle = this.configObject[message.guild.id];
            if (message.channel.type !== `text`) return reject(Error(`Cannot accent non-guild user!`));
            if (this.configObject === null) return reject(Error(`configObject invalid!`));
            if (objectHandle === undefined) return reject(Error(`Guild is not initialised!`));

            const username = `${message.author.username}#${message.author.discriminator}`;
            let prevAccent = undefined;
            
            if (objectHandle.accents[message.author.id] === undefined) objectHandle.accents[message.author.id] = { user: username, accent: accent};
            else
            {   
                prevAccent = objectHandle.accents[message.author.id].accent;
                if (!objectHandle.accents[message.author.id] || overwrite) objectHandle.accents[message.author.id].accent = accent;
            }
            
            this.writeToJSON().then( () => 
            {
                if (overwrite) return resolve(`Changed accent to ${accent}!`);
                else return resolve();
            }, err => 
            {
                objectHandle.accents[message.author.id].accent = prevAccent;
                return reject(err);
            });
        });

    }
}

async function createConfigDir(callback)
{
    fs.mkdir(configFolderPath, (err) =>
    {
        if (err && err.code !== `EEXIST`)
        {
            return callback(err);
        }

        if (JSON.stringify(configTemplate, null, 4) === ``) throw Error(`INVESTIGATE`);
        fs.writeFile(configFilePath, JSON.stringify(configTemplate, null, 4), { flag: `wx` }, (err) =>
        {
            if (err)
            {
                return callback(err);
            }

            fs.access(configFilePath, fs.constants.R_OK | fs.constants.W_OK, (err) =>
            {
                if (err) return callback(err);
                else
                {
                    return callback(false);
                }
            });
        });
    }); //Callback hell-ish
}

async function readConfig(callback)
{
    fs.readFile(configFilePath, `utf8`, (err, data) =>
    {
        if (err)
        {
            createConfigDir( (err) =>
            {
                if (err)
                {
                    err.message = `WARNING: Unable to create config files! ${err.message}`;
                    return l.logError(err);
                }

                readConfig(callback);
            });
        }

        else
        {
            callback(data);
        }
    });
}

exports.config = new config();
