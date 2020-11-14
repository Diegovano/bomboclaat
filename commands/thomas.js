const Discord = require(`discord.js`);

module.exports = {
    name: `thomas`,
    description: `erm...yh`,
    async execute(message, args)
    {
        const connection = await message.member.voice.channel.join();
        connection.play(`./thomas.wav`);
    }
}
