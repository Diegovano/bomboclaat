'use strict';

import { bomboModule } from '../types';
import { log } from '../log';
import {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus
} from '@discordjs/voice';

export const module: bomboModule = {
  name: 'test',
  args: null,
  usage: null,
  dmCompatible: false,
  voiceConnection: true,
  textBound: true,
  async execute (message, _args) {
    if (!message.guild || !message.member || !message.member.voice.channel) return;

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 5_000);

    const audioPlayer = createAudioPlayer();

    connection.subscribe(audioPlayer);

    const audioResource = createAudioResource('./pol.mp3', {
      inputType: StreamType.Arbitrary
    });

    audioPlayer.play(audioResource);

    await entersState(audioPlayer, AudioPlayerStatus.Playing, 5_000);

    log('playing!');
  }
};
