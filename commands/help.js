const Discord = require("discord.js");
const prefix = `|`; // static prefix for now

module.exports =
{
    name: `help`,
    aliases: [`h`, `commands`],
    description: `List all commands or more info about a specific command.`,
    usage: `[command name]`,
    execute(message, args)
    {
        const { commands } = message.client;

        if (!args.length) // Show help for all commands
        {
            const helpEmbed = new Discord.MessageEmbed()
                .setTitle(`Here's a list of all commands:`)
                .addField(commands.map(command => command.name).join(`\n`), `\nYou can sent ${prefix}help [command name] to get info on a specific command!`);

            return message.channel.send(helpEmbed); // split true means that should the message be too long, it will be cut into multiple messages.
        }

        const name = args[0].toLowerCase(0);
        const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));

        if (!command)
        {
            return message.reply(`that's not a valid command!`);
        }

        const helpEmbed = new Discord.MessageEmbed()
              .setTitle(`NAME:\n${command.name}`)
              .setColor(`0xF1C40F`)
              .setThumbnail(`https://allthatsinteresting.com/wordpress/wp-content/uploads/2014/10/weird-jesus-rasta-jesus.jpg`);

        if (command.aliases && command.description && command.usage) helpEmbed.addField(`ALIASES:`, `${command.aliases}`);
        if (command.description) helpEmbed.addField(`DESCRIPTION:`, `${command.description}`)
        if (command.usage) helpEmbed.addField(`USAGE:`, `${command.usage}`);

        message.channel.send(helpEmbed);
    },
};
