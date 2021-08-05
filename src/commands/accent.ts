'use strict';

import { getQueue } from '../audio';
import { bomboModule } from '../types';

export const module: bomboModule = {
  name: 'accent',
  aliases: ['a'],
  description: 'Fuck diegos descriptions',
  args: 2,
  usage: '<language> <text>',
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  async execute (message, args) {
    if (!message.guild) return;
    const currentQueue = getQueue(message.guild);

    currentQueue.voiceChannel = message.member?.voice.channel ?? null;

    const languages = ['french', 'german', 'russian', 'japanese', 'chinese', 'english', 'arabic', 'italian', 'spanish', 'korean', 'portuguese', 'swedish', 'dutch', 'nz', 'aussie', 'quebec', 'indian', 'american', 'welsh'];

    let lang;

    args[0] = args[0].toLowerCase();

    switch (args[0]) {
      case languages[0]:
        lang = 'fr';
        break;
      case languages[1]:
        lang = 'de';
        break;
      case languages[2]:
        lang = 'ru';
        break;
      case languages[3]:
        lang = 'ja';
        break;
      case languages[4]:
        lang = 'zh';
        break;
      case languages[5]:
        lang = 'en';
        break;
      case languages[6]:
        lang = 'ar';
        break;
      case languages[7]:
        lang = 'it';
        break;
      case languages[8]:
        lang = 'es';
        break;
      case languages[9]:
        lang = 'ko';
        break;
      case languages[10]:
        lang = 'pt';
        break;
      case languages[11]:
        lang = 'sw';
        break;
      case languages[12]:
        lang = 'nl';
        break;
      case languages[13]:
        lang = 'en_nz';
        break;
      case languages[14]:
        lang = 'en_au';
        break;
      case languages[15]:
        lang = 'fr_ca';
        break;
      case languages[16]:
        lang = 'hi';
        break;
      case languages[17]:
        lang = 'en_us';
        break;
      default:
        lang = args[0];
    }

    currentQueue.queueAccent(lang, args.splice(1).join(' '));
  }
};
