'use strict';

const conf = require('../configFiles.js');
const Discord = require('discord.js');

module.exports = {
  name: 'xp',
  aliases: ['level', 'leaderboard', 'lb'],
  description: 'Check the amount of xp you have as well as the current rankings',
  args: false,
  async execute (message, _) {
    const objectHandle = conf.config.configObject[message.guild.id].accents;
    const lvl = objectHandle[message.author.id].level;
    const xpRequired = 5 * (lvl ^ 2) + (50 * lvl) + 100;
    const ranking = [];
    for (const userID in objectHandle) {
      const userData = objectHandle[userID];
      if (userData.level !== undefined && userData.level !== 0 && userData.xp !== 0) {
        ranking.splice(sortedIndex(ranking, userData.level, userData.xp), 0, [userData.user, userData.level, userData.xp]);
      }
    }
    const embed = new Discord.MessageEmbed()
      .setColor('#0000ff')
      .setTitle('Rankings')
      .setDescription(`${message.author.username}#${message.author.discriminator}: level ${lvl}   (${objectHandle[message.author.id].xp || 0} / ${xpRequired} XP)`)
      .setAuthor(message.guild.me.nickname, message.client.user.displayAvatarURL());
    let i = 1;
    for (const rank in ranking) {
      embed.addField(`#${i} ${ranking[rank][0]}: level ${ranking[rank][1]}`, `(${ranking[rank][2]} / ${5 * (ranking[rank][1] ^ 2) + (50 * ranking[rank][1]) + 100} XP)`);
      if (i === 25) break; // Can only have 25 fields on a single embed
      i++;
    }
    message.channel.send(embed);
  }
};

function sortedIndex (array, value, value2) {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (array[mid][1] > value || (array[mid][1] === value && array[mid][2] > value2)) low = mid + 1;
    else high = mid;
  }
  return low;
}
