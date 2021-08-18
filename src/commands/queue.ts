'use strict';

import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { module as clearjs } from './queue/clear';
import { module as loopjs } from './queue/loop';
import { module as movejs } from './queue/move';
import { module as removejs } from './queue/remove';
import { module as seekjs } from './queue/seek';
import { module as shufflejs } from './queue/shuffle';
import { module as skipjs } from './queue/skip';
import { module as trackinfojs } from './queue/trackinfo';
import { module as viewjs } from './queue/view';

function converter (module: bomboModule) : SlashCommandSubcommandBuilder | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder) {
  return <SlashCommandSubcommandBuilder | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder)>module.slashCommand.setName(module.name).setDescription(module.description);
}

export const module: bomboModule = {
  name: 'queue',
  description: 'All the queue commands.',
  slashCommand: new SlashCommandBuilder()
    .addSubcommand(converter(viewjs))
    .addSubcommand(converter(trackinfojs))
    .addSubcommand(converter(skipjs))
    .addSubcommand(converter(seekjs))
    .addSubcommand(converter(shufflejs))
    .addSubcommand(converter(loopjs))
    .addSubcommand(converter(clearjs))
    .addSubcommand(converter(movejs))
    .addSubcommand(converter(removejs)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: true,
  async execute (interaction:VoiceCInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case 'clear':
        clearjs.execute(interaction);
        break;
      case 'loop':
        loopjs.execute(interaction);
        break;
      case 'move':
        movejs.execute(interaction);
        break;
      case 'remove':
        removejs.execute(interaction);
        break;
      case 'seek':
        seekjs.execute(interaction);
        break;
      case 'shuffle':
        shufflejs.execute(interaction);
        break;
      case 'skip':
        skipjs.execute(interaction);
        break;
      case 'trackinfo':
        trackinfojs.execute(interaction);
        break;
      case 'view':
        viewjs.execute(interaction);
        break;
    }
  }
};
