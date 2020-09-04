const prefix = `|`; // static prefix for now

module.exports =
{
    name: `help`,
    aliases: [`h`, `commands`],
    description: `List all commands or more info about a specific command.`,
    usage: `[command name]`,
    execute(message, args)
    {
        const data = [];
        const { commands } = message.client;

        if (!args.length) // Show help for all commands
        {
            data.push(`Here's a list of all commands:`);
            data.push(commands.map(command => command.name).join(`\n`));
            data.push(`\nYou can sent ${prefix}help [command name] to get info on a specific command!`);

            return message.channel.send(data, { split: true }); // split true means that should the message be too long, it will be cut into multiple messages.
        }

        const name = args[0].toLowerCase(0);
        const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));

        if (!command)
        {
            return message.reply(`that's not a valid command!`);
        }

        data.push(`NAME: ${command.name}`);

        if (command.aliases) data.push(`ALIASES: ${command.aliases}`);
        if (command.description) data.push(`DESCRIPTION: ${command.description}`);
        if (command.usage) data.push(`USAGE: ${command.usage}`);

        message.channel.send(data, { split: true });
    },
};