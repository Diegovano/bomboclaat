const conf = require(`../configFiles.js`);
const l = require(`../log.js`);

module.exports = {
    name: `setaccent`,
    description: `Assign yourself an in-chat accent`,
    guildOnly: true,
    args: true,
    usage: `<language>`,
    async execute(message, args)
    {
        conf.config.accentUser(message, args[0]).catch( (err) =>
        {
            err.message = `WARNING: Could not update user accent! ${err.message}`;
            l.logError(err);
        });
    }
};
