'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.module = void 0;
const log_1 = require("../log");
const voice_1 = require("@discordjs/voice");
exports.module = {
    name: 'test',
    args: null,
    usage: null,
    dmCompatible: false,
    voiceConnection: true,
    textBound: true,
    execute(message, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.guild || !message.member || !message.member.voice.channel)
                return;
            const connection = (0, voice_1.joinVoiceChannel)({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
            yield (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 5000);
            const audioPlayer = (0, voice_1.createAudioPlayer)();
            connection.subscribe(audioPlayer);
            const audioResource = (0, voice_1.createAudioResource)('./pol.mp3', {
                inputType: voice_1.StreamType.Arbitrary
            });
            audioPlayer.play(audioResource);
            yield (0, voice_1.entersState)(audioPlayer, voice_1.AudioPlayerStatus.Playing, 5000);
            (0, log_1.log)('playing!');
        });
    }
};
//# sourceMappingURL=test.js.map