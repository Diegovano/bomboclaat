'use strict';

const conf = require('../configFiles.js');

module.exports = {
  name: 'xp',
  aliases: ['level', 'leaderboard', 'lb'],
  description: 'Check the amount of xp you have as well as the current rankings',
  args: false,
  async execute (message, _) {
    const objectHandle = conf.config.configObject[message.guild.id].accents;
    const lvl = objectHandle[message.author.id].level;
    const xpRequired = 5 * (lvl ^ 2) + (50 * lvl) + 100;
    message.reply(` you are on level ${lvl || 0} and have ${objectHandle[message.author.id].xp || 0} / ${xpRequired} XP`);
    const ranking = [];
    for (const userID in objectHandle) {
      const userData = objectHandle[userID];
      if (userData.level !== undefined && userData.level !== 0 && userData.xp !== 0) {
        ranking.splice(sortedIndex(ranking, userData.level, userData.xp), 0, [userData.user, userData.level, userData.xp]);
      }
    }
    console.log(ranking);
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
