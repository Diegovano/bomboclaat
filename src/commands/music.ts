'use strict';

import { bomboModule, VoiceCInteraction } from '../types';
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { module as leavejs } from './music/leave';
import { module as volumejs } from './music/volume';
import { module as switchjs } from './music/switch';

function converter (module: bomboModule) : SlashCommandSubcommandBuilder | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder) {
  return <SlashCommandSubcommandBuilder | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder)>module.slashCommand.setName(module.name).setDescription(module.description);
}

export const module: bomboModule = {
  name: 'music',
  description: 'All the music commands that don\'t act on a queue',
  slashCommand: new SlashCommandBuilder()
    .addSubcommand(converter(leavejs))
    .addSubcommand(converter(volumejs))
    .addSubcommand(converter(switchjs)),
  dmCompatible: false,
  voiceConnection: true,
  textBound: false,
  ignoreBotChannel: true,
  async execute (interaction:VoiceCInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case 'leave':
        leavejs.execute(interaction);
        break;
      case 'volume':
        volumejs.execute(interaction);
        break;
      case 'switch':
        switchjs.execute(interaction);
        break;
    }
  }
};
