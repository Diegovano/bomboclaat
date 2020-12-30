module.exports = {
  name: 'thomas',
  description: 'erm...yh',
  voiceConnection: true,
  async execute (message, _args) {
    const connection = await message.member.voice.channel.join();
    connection.play('./thomas.wav');
  }
};
