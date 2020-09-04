const Discord = require(`discord.js`);

module.exports =
{
    name: `info`,
    aliases: [`i`, `inf`],
    description: `Gives critical information about the person.`,
    args: false,
    guildOnly: true,
    execute(message, args)
    {
        var sexuality = `Straight`;
        switch (message.author.username)
        {
            case `Powered By Salt`:
                sexuality = `curvy`;
                break;
            
            case `Terminator00702`:
                sexuality = `poof`;
                break;

            case `Gabriele`:
                sexuality = `oMnisexual`;
                break;

            case `Jacko`:
                sexuality = `Penguin`;
                break;

            case `Jesus du 89`:
                sexuality = `Dragon`;
                break;

            case `bowser from sonic`:
                sexuality = `gay bombocraasclaat`;
                break;
        }

        const embed = new Discord.MessageEmbed()
            .setTitle(`User Info`)
            .addField(`Playername`, message.author.username)
            .addField(`Sexuality`, sexuality)
            .addField(`Your favourite server is:`, message.guild.name)
            .setColor(0xF1C40F)
            .setThumbnail(message.author.displayAvatarURL());
        
        message.channel.send(embed);
    }
};