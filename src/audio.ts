'use strict';

import * as Discord from 'discord.js';
import * as Voice from '@discordjs/voice';
import { google, youtube_v3 as youtubev3 } from 'googleapis';
import { readFileSync } from 'fs';
import { log, logError } from './log';
import ytdl = require('discord-ytdl-core');

const youtube = google.youtube('v3');

const DEFAULT_VOLUME = 0.15;
const DISABLE_ACCENT_QUEUE = true;

function pad (num: number | string) {
  let s = num + '';
  while (s.length < 2) s = '0' + s;
  return s;
}

/**
 * Convert duration in seconds to fomatted string.
 * @param duration Number of seconds
 * @returns string formatted in HH:MM:SS
 */
export function ConvertSecToFormat (duration: number): string {
  duration = Math.round(duration);
  const seconds = duration % 60;
  const minutes = Math.floor(duration / 60) % 60;
  const hours = Math.floor(duration / 3600);
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (minutes > 0) return `${pad(minutes)}:${pad(seconds)}`;
  if (seconds > 0) return `00:${pad(seconds)}`;
  else return '00:00';
}

/**
 * Convert strings formatted in ISO 8601 to duration in seconds.
 * @param ISO String in ISO 8601 format
 * @returns The duration entered in seconds
 */
function ConvertIsoToSec (ISO: string) {
  const regex = /P((([0-9]*\.?[0-9]*)Y)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)W)?(([0-9]*\.?[0-9]*)D)?)?(T(([0-9]*\.?[0-9]*)H)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)S)?)?/; // Thanks regex101.com
  const matches = ISO.match(regex);
  if (matches === null) return null;
  else {
    const sum = parseInt(matches[16] ?? '0') + parseInt(matches[14] ?? '0') * 60 + parseInt(matches[12] ?? '0') * 3600 + parseInt(matches[9] ?? '0') * 86400;
    return sum; // Doing up to a day
  }
}

/**
 * Replace HTML character codes with UTF-8 equivalents and escape markdown.
 * @param origStr string to precess
 * @returns prrocessed string
 */
function replaceUnicode (origStr: string) { // and escape markdown
  origStr = origStr.replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, '\'')
    .replace(/&quot;/gi, '"');

  const unescaped = origStr.replace(/\\(\*|_|`|\||~|\\)/g, '$1');
  return unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1');
}

/**
 * Attemps to join a voice channel.
 * @param channel the voice channel to connect to
 */
async function connectVoice (channel: Discord.VoiceChannel | Discord.StageChannel) {
  return new Promise<Voice.VoiceConnection>((resolve, reject) => {
    const connection = Voice.joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      // @ts-expect-error InternalDiscordGatwayAdapterCreator and DiscordGatewayAdapterCreator seem to be comaptible...
      adapterCreator: channel.guild.voiceAdapterCreator
    }).on('error', error => reject(error))
      .on('stateChange', async (_, newState) => { // using code from discord.js/voice examples
        if (newState.status === Voice.VoiceConnectionStatus.Ready) resolve(connection);
        if (newState.status === Voice.VoiceConnectionStatus.Disconnected) {
          if (newState.reason === Voice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          /*
            If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
            but there is a chance the connection will recover itself if the reason of the disconnect was due to
            switching voice channels. This is also the same code for the bot being kicked from the voice channel,
            so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
            the voice connection.
            */
            try {
              await Voice.entersState(connection, Voice.VoiceConnectionStatus.Connecting, 5_000);
              // Probably moved voice channel
            } catch {
              connection.destroy();
              // return reject(Error('Unable to connect to voice channel!'));
              // Probably removed from voice channel
            }
          } else if (connection.rejoinAttempts < 5) {
            /*
            The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
            */
            setTimeout(() => {
              connection.rejoin();
            }, (connection.rejoinAttempts + 1) * 5_000);
          } else {
            /*
              The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
            */
            connection.destroy();
          }
        }
      });
  });
}

/**
 * Fetch the queue asociated to the guild. If none exists creates one.
 * @param guild The guild whose queue to retrieve
 * @returns The queue associated to the guild given as an argument
 */
export function getQueue (guild: Discord.Guild): Queue {
  const queue = queueMap.get(guild.id);
  if (queue) return queue;
  else return new Queue(guild);
}

/**
 * Attempt to delete the queue associated to a guild.
 * @param guild The guild whose queue to delete
 * @param suppressWarning Whether or not to silence a warning if no queue exists associated to that guild
 * @returns `true` if the queue is successfully deleted, `false` otherwise
 */
export function deleteQueue (guild: Discord.Guild, suppressWarning = false): boolean {
  if (!queueMap.has(guild.id)) {
    if (!suppressWarning) log('Cannot delete queue: no queue exists on that guild!');
    return false;
  }
  queueMap.delete(guild.id);
  return true;
}

/**
 * Get the link to the audio resource used to play text to speech with accents.
 * @param language the accent to use
 * @param text the text to read out
 * @returns A URL HREF
 */
function getTTSLink (language: string, text: string) {
  return new URL(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${text}`).href;
}

/**
 * Class for audio Tracks
 */
export class Track {
  /**
   * YouTube videoID composed of 11 alphanumeric characters as well as `_` and `-`.
   */
  videoId: string;

  /**
   * Link to audio source.
   */
  sourceLink: string;

  /**
   * The track's author.
   */
  author: string;

  /**
   * The title of the track
   */
  title: string;

  /**
   * The description of the track.
   */
  description: string;

  /**
   * A link to an image resource for the track.
   */
  icon: string;

  /**
   * The guild member that requested the track.
   */
  requestedBy: Discord.GuildMember;

  /**
   * The number of seconds at which to begin playback.
   */
  startOffset: number;

  /**
   * The time at which the track was added to the queue.
   */
  requestTime: Date;

  /**
   * The duration of the track in seconds.
   */
  duration: number;
  constructor (videoID: string, author: string, title: string,
    description: string, icon: string, requestedBy: Discord.GuildMember,
    startOffset: number, duration?: number) {
    this.videoId = videoID;
    this.sourceLink = `https://www.youtube.com/watch?v=${videoID}`;
    this.author = replaceUnicode(author);
    this.title = replaceUnicode(title);
    this.description = replaceUnicode(description);
    this.icon = icon;
    this.requestedBy = requestedBy;
    this.startOffset = startOffset || 0;
    this.requestTime = new Date();

    if (!duration) {
      this.duration = 0; // set base value to duration
      let ytkey;
      if (!process.env.YTTOKEN) { // Check if running github actions or just locally
        try {
          ytkey = readFileSync('.yttoken', 'utf8');
        } catch (err) {
          logError(Error('Cannot read YouTube key!'));
          return;
        }
      } else {
        ytkey = process.env.YTTOKEN;
      }

      const opts: youtubev3.Params$Resource$Videos$List =
          {
            part: ['contentDetails'],
            id: [videoID],
            key: ytkey
          };
      youtube.videos.list(opts).then(res => {
        if (!res.data.items) {
          logError(Error('WARNING: Unable to get duration!'));
        } else this.duration = ConvertIsoToSec(res.data.items[0].contentDetails?.duration ?? '') ?? 0; // if there is a problem set duration to 0
      }, reason => {
        logError(Error(`WARNING: Unable to get duration! ${reason}`));
      });
    } else {
      this.duration = duration;
    }
  }
}

/**
 * Class for queues
 */
export class Queue {
  /**
   * ID of the guild to which this queue is assigned.
   */
  private guildId: string;

  /**
   * A handle to the bot client.
   */
  private client: Discord.Client;

  /**
   * The text channel that the queue is bound to in the guild.
   */
  textChannel?: Discord.ThreadChannel | Discord.TextChannel | Discord.NewsChannel;

  /**
   * The voice channel that the queue is bound to in the guild.
   */
  voiceChannel: Discord.VoiceChannel | Discord.StageChannel | null;

  /**
   * The connection to a voice channel of the guild.
   */
  private connection: Voice.VoiceConnection | null;

  /**
   * The array containing tracks played, current and upcoming.
   */
  private trackList: Track[];

  /**
   * The position of the current track in the track list.
   */
  queuePos: number;

  /**
   * Whether or not the queue is playing.
   */
  playing: boolean;

  /**
   * Whether or not the queue is paused.s
   */
  paused: boolean;

  /**
   * The player that is responsible for track playback.
   */
  private trackAudioPlayer: Voice.AudioPlayer;

  /**
   * The subscription to an audio player.
   */
  private subscription?: Voice.PlayerSubscription;

  /**
   * The volume for tracks.
   */
  private volume: number;

  /**
   * The number of senconds to seek to.
   */
  private seekTime: number;

  /**
   * Whether or not the current track is looping.
   */
  loopTrack: boolean;

  /**
   * Whether or not the current queue is looping.
   */
  loopQueue: boolean;

  /**
   * The audio player responsible for playing accents and text to speech.
   */
  private accentAudioPlayer: Voice.AudioPlayer;

  /**
   * The array containing the list of accents.
   */
  languages: string[];

  /**
   * The array containing queued text to speech actions.
   */
  accentList: {language: string, text: string}[];

  /**
   * Whether or not an accent is being played.
   */
  playingAccent: boolean;

  /**
   * The timeout to disconnect the bot after an accent operation.
   */
  // eslint-disable-next-line no-undef
  accentTimeoutId?: NodeJS.Timeout;

  /**
   * The timestamp at which track playback was stopped for an accent to be played. Necessary to resume playback at the right moment.
   */
  private stopTimestamp: number | null;

  constructor (guild: Discord.Guild) {
    this.guildId = guild.id;
    this.client = guild.client;

    queueMap.set(this.guildId, this);
    this.voiceChannel = null;
    this.connection = null;

    this.trackList = [];
    this.queuePos = 0;
    this.playing = false;
    this.paused = false;
    this.trackAudioPlayer = new Voice.AudioPlayer({ behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Pause } });
    this.volume = DEFAULT_VOLUME;
    this.seekTime = 0;
    this.loopTrack = false;
    this.loopQueue = false;

    this.accentAudioPlayer = new Voice.AudioPlayer({ behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Pause } });
    this.languages = ['fr', 'de', 'ru', 'ja', 'zh', 'en', 'it', 'es', 'ko', 'pt', 'sw', 'nl', 'en_nz', 'en_au', 'fr_ca', 'hi', 'en_us'];
    this.accentList = [];
    this.playingAccent = false;
    this.accentTimeoutId = undefined;
    this.stopTimestamp = null;
  }

  /**
   * Assign a certain voice channel to the queue and check the bot has connect and speak permissions. Then join that channel.
   * @param voiceChannel The voice channel to join
   * @returns A voice promise that will resolve once a connection has successfully been established.
   */
  async setVoiceChannel (voiceChannel: Discord.VoiceChannel | Discord.StageChannel) : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.guilds.fetch(this.guildId).then(async function getClientGuildMember (guild) {
        const clientGuildMem = guild.client.user ? await guild.members.fetch(guild.client.user?.id).catch(err => reject(err)) : null;
        if (clientGuildMem && voiceChannel.permissionsFor(clientGuildMem).has(['CONNECT', 'SPEAK'])) {
          getQueue(guild).voiceChannel = voiceChannel;
          getQueue(guild).connection = await connectVoice(voiceChannel);
          return resolve();
        } else return reject(Error('Insufficent permissions in that voice channel!'));
      });
    });
  }

  /**
   * Connect to a voice channel, then current track in the queue.
   * @param seconds the number of seconds to start playing at
   * @param isSeek whether or not the current operation is a seek operation. If not then a confimation message will be sent to the bound text channel
   * @param repeated the number of attemps to play that have taken place
   * @returns {Promise<string | void>} the string represents the message to be sent describing the operation, for example "now playing x", or void if no message
   */
  async play (seconds = 0, isSeek = false, repeated = 0) : Promise<string | void> {
    if (this.accentTimeoutId) {
      clearTimeout(this.accentTimeoutId);
      this.accentTimeoutId = undefined;
    }

    try {
      if (!this.voiceChannel) throw Error('WARNING: No voice channel allocated to this queue!');
      this.connection = await connectVoice(this.voiceChannel);
    } catch (err) {
      return Promise.reject(err);
    }

    return new Promise<string | void>((resolve, reject) => {
      this.playing = true;
      this.subscription = this.connection?.subscribe(this.trackAudioPlayer);
      const begin = seconds !== 0 ? `${seconds}s` : `${this.trackList[this.queuePos].startOffset}s`;
      if (this.queuePos > this.trackList.length - 1) return reject(Error('queuePos out of range'));

      const trackAudioResource = Voice.createAudioResource(ytdl(this.trackList[this.queuePos].sourceLink, {
        seek: parseInt(begin),
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      }));
      this.trackAudioPlayer.play(trackAudioResource);
      this.trackAudioPlayer
        .on('stateChange', (oldState, newState) => {
          if (oldState.status === Voice.AudioPlayerStatus.Playing && newState.status === Voice.AudioPlayerStatus.Idle) {
            if (!this.loopTrack) this.queuePos++;
            this.seekTime = 0;

            if (this.queuePos >= this.trackList.length) {
              if (!this.loopQueue) {
                this.playing = false;
                this.subscription?.unsubscribe();
                this.subscription = undefined;
                this.connection?.disconnect();
                return;
              } else {
                this.queuePos = 0;
                this.play().then(msg => {
                  if (msg) this.textChannel?.send(msg);
                }, err => {
                  err.message = `WARNING: Cannot play track! ${err.message}`;
                  logError(err);
                  this.skip().catch(err1 => {
                    err1.message = `WARNING: Cannot skip track! ${err.message}`;
                    logError(err1);
                  });
                });
              }
            }

            this.play().then(msg => {
              if (msg) this.textChannel?.send(msg);
            }, err => {
              err.message = `WARNING: Cannot play track! ${err.message}`;
              logError(err);
              this.skip().catch(err1 => {
                err1.message = `WARNING: Cannot skip track! ${err.message}`;
                logError(err1);
              });
            });
          }
        })
        .on('error', err => {
          repeated = repeated || 0;
          if (repeated > 4) {
            err.message = `Unable to play track after five attempts! ${err.message}`;
            logError(err);
            this.textChannel?.send('Unable to play that! Skipping...');
            this.skip().then(msg => {
              if (msg) this.textChannel?.send(msg);
            }, err => {
              err.message = `WARNING: Cannot play track after an unavailable one! ${err.message}`;
              logError(err);
            });
          }

          if (repeated === 0) log(`Error playing track, trying again! ${err.message}`);
          this.play(this.timestamp, isSeek, ++repeated); // test the use of return
        });

      this.setVolume(this.volume);
      if (!isSeek && repeated === 0) return resolve(`Now playing **${this.trackList[this.queuePos].title}** [${ConvertSecToFormat(this.trackList[this.queuePos]?.duration)}], requested by **${this.trackList[this.queuePos].requestedBy}** at ${this.trackList[this.queuePos].requestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      else resolve();
    });
  }

  /**
   * Add new tracks to the queue.
   * @param track The track to add to the queue
   * @param playlist Whether or not the track is in a playlist (affects confirmation message sent)
   * @param playingNext Whether or not to put track in the next position in the queue.
   * @returns A promise that can resolve to a `string` (this is the confirmation message that can be sent to the text channel) or `null`
   */
  async add (track: Track, playlist: boolean, playingNext: boolean) : Promise<string | void> {
    return new Promise<string | void>((resolve, reject) => {
      const oldQueueLength = this.queueDuration;

      this.trackList.splice(playingNext ? this.queuePos + 1 : this.trackList.length, 0, track);
      if (!this.playing) {
        this.play().then(msg => {
          resolve(msg);
        }, err => {
          reject(err);
        });
      } else if (!playlist) {
        return resolve(`${track.title} [${ConvertSecToFormat(track.duration)}], playing in ${playingNext ? ConvertSecToFormat(this.currentTrack?.duration ?? 0) /* this.currentTrack exits because playing bool is true */ : ConvertSecToFormat(oldQueueLength)} has been added to the queue by ${track.requestedBy}`);
      } else return resolve();
    });
  }

  /**
   * Get embeds containing the full queue, past, current, and upcoming tracks.
   * @returns A promise that resolves to the array of embeds containing the queue or the message "Queue is empty!"
   */
  async getQueueMessage () : Promise<Discord.MessageEmbed[] | string> {
    return new Promise<Discord.MessageEmbed[] | string>(resolve => {
      if (this.trackList.length === 0) return resolve('Queue is empty!');

      const pastTracks = [''];

      for (let i = 0, i2 = 0; i < this.queuePos; i++) {
        const trackAppend = `\nTrack ${i + 1}: [${this.trackList[i].title}](${this.trackList[i].sourceLink}) [${ConvertSecToFormat(this.trackList[i].duration)}], requested by ${this.trackList[i].requestedBy}.`;
        if (pastTracks[i2].length + trackAppend.length < 1024) pastTracks[i2] += trackAppend;
        else {
          i2++;
          pastTracks.push(trackAppend);
        }
      }

      const currentTrack = [''];

      if (this.trackList.length > this.queuePos) {
        const trackDuration = this.trackList[this.queuePos].duration;
        currentTrack[0] = `\nTrack ${this.queuePos + 1}: [${this.trackList[this.queuePos].title}](${this.trackList[this.queuePos].sourceLink}&t=${Math.floor(this.timestamp)}) [${ConvertSecToFormat(trackDuration)}], requested by ${this.trackList[this.queuePos].requestedBy}.`;
      }

      const nextTracks = [''];

      for (let i = this.queuePos + 1, i2 = 0; i < this.trackList.length; i++) {
        const trackDuration = this.trackList[i].duration;
        const trackAppend = `\nTrack ${i + 1}: [${this.trackList[i].title}](${this.trackList[i].sourceLink}) [${ConvertSecToFormat(trackDuration)}], requested by ${this.trackList[i].requestedBy}.`;
        if (nextTracks[i2].length + trackAppend.length < 1024) nextTracks[i2] += trackAppend;
        else {
          i2++;
          nextTracks.push(trackAppend);
        }
      }

      const queueEmbeds = [new Discord.MessageEmbed()
        .setColor('#0000ff')
        .setTitle(`Queue [${this.queueDuration !== 0 ? ConvertSecToFormat(this.queueDuration) : ' no upcoming tracks '}]`)
        .setDescription(`Looping: ${this.loopTrack ? 'Track' : this.loopQueue ? 'Queue' : 'Disabled'}`)];

      if (this.textChannel?.client.user) queueEmbeds[0].setAuthor('Bomborastclaat', this.textChannel.client.user.displayAvatarURL());

      let i2 = 0;
      if (pastTracks[0] !== '') {
        for (let i = 0; i < pastTracks.length; i++) {
          const fieldToAdd = { name: i === 0 ? `Past Track${this.queuePos > 1 ? 's' : ''}:` : 'continued...', value: pastTracks[i] };
          const authorName = queueEmbeds[i2].author?.name;
          if (queueEmbeds[i2].length + (authorName ? authorName.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000) queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
          else {
            queueEmbeds.push(new Discord.MessageEmbed().setColor('#0000ff'));

            queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
          }
        }
      }
      if (currentTrack[0] !== '') {
        const fieldToAdd = { name: 'Current Track:', value: currentTrack[0] };
        const authorName = queueEmbeds[i2].author?.name;
        if (queueEmbeds[i2].length + (authorName ? authorName.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000) queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
        else {
          queueEmbeds.push(new Discord.MessageEmbed().setColor('#0000ff'));
          queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
        }
        queueEmbeds[i2].setThumbnail(this.trackList[this.queuePos].icon);
      }
      if (nextTracks[0] !== '') {
        for (let i = 0; i < nextTracks.length; i++) {
          const fieldToAdd = { name: i === 0 ? `Upcoming Track${this.queuePos < this.trackList.length - 2 ? 's' : ''}:` : 'continued...', value: nextTracks[i] };
          const authorName = queueEmbeds[i2].author?.name;
          if (queueEmbeds[i2].length + (authorName ? authorName.length : 0) + fieldToAdd.name.length + fieldToAdd.value.length < 6000) queueEmbeds[i2].addField(fieldToAdd.name, fieldToAdd.value);
          else {
            queueEmbeds.push(new Discord.MessageEmbed().setColor('#0000ff'));
            queueEmbeds[++i2].addField(fieldToAdd.name, fieldToAdd.value);
          }
        }
      }
      return resolve(queueEmbeds);
    });
  }

  /**
   * Skip the current track in the queue and start playing the next.
   * @returns A promise that resolves to a confirmation message
   */
  async skip () : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.trackList.length === 0 || this.queuePos > this.trackList.length - 1) return resolve('No track to skip!');
      if (this.queuePos > this.trackList.length - 2) { // -2 becuase the last track is being played
        if (!this.loopQueue) {
          this.playing = false;
          this.subscription?.unsubscribe();
          this.subscription = undefined;
          this.connection?.disconnect();
          this.queuePos++;
          return resolve(`Skipping final track: ${this.trackList[this.queuePos - 1].title} and disconnecting.`);
        } else {
          this.queuePos = 0;
          this.play().then(msg => {
            resolve(`Looping the queue!\n${msg}`);
          }, err => {
            reject(err);
          });
        }
      } else {
        this.queuePos++;
        this.play().then(msg => {
          resolve(`Skipping ${this.trackList[this.queuePos - 1].title}.\n${msg}`);
        }, err => {
          reject(err);
        });
      }
    });
  }

  /**
   * Shuffle the upcoming tracks.
   */
  async shuffle () : Promise<string> {
    return new Promise<string>(resolve => {
      const upcomingTracks = this.trackList.slice(this.queuePos);

      for (let currentIndex = upcomingTracks.length; currentIndex > 0;) {
        const randomIndex = Math.floor(Math.random() * currentIndex--);

        const tempValue = upcomingTracks[currentIndex];
        upcomingTracks[currentIndex] = upcomingTracks[randomIndex];
        upcomingTracks[randomIndex] = tempValue;
      }

      for (let i = 0; i < upcomingTracks.length + 1; i++) this.trackList[this.trackList.length - i] = upcomingTracks[upcomingTracks.length - i];

      resolve(`Shuffled ${upcomingTracks.length} tracks!`);
    });
  }

  /**
   * Stop the queue and disconnect from the voice channel.
   */
  async disconnect () : Promise<void> {
    this.trackAudioPlayer.pause();
    this.accentAudioPlayer.stop();
    this.subscription?.unsubscribe();

    this.connection?.disconnect();
  }

  /**
   * Get the voice channel to which the client is connected, if any.
   */
  get activeVoiceChannel () : Promise<Discord.Channel | null> | null {
    if (this.connection?.joinConfig.channelId) return this.client.channels.fetch(this.connection.joinConfig.channelId);
    else return null;
  }

  /**
   * Get the current track
   */
  get currentTrack () : Track | null { // keep sync as function return an object
    if (this.playing) return this.trackList[this.queuePos];
    else return null;
  }

  /**
   * Get the current timestamp.
   */
  get timestamp () : number {
    return Math.round((this.seekTime !== 0 ? this.seekTime : this.trackList[this.queuePos].startOffset) + (this.trackAudioPlayer.state.status === Voice.AudioPlayerStatus.Playing ? (this.trackAudioPlayer.state.playbackDuration / 1000) : 0));
  }

  /**
   * Get the total duration of tracks left on the queue.
   */
  get queueDuration () : number {
    let duration = 0;
    for (let i = this.queuePos + 1; i < this.trackList.length; i++) duration += this.trackList[i].duration;
    duration += this.currentTrack ? this.currentTrack.duration - this.timestamp : 0;

    return duration;
  }

  /**
   * Pause the player.
   * @returns A promise with a confirmation message
   */
  async pause () : Promise<string> {
    return new Promise<string>(resolve => {
      if (!this.playing) return resolve('Cannot Pause: Nothing playing!');
      if (this.paused) return resolve('Cannot Pause: Player is already paused!');

      this.paused = true;
      this.trackAudioPlayer.pause();
    });
  }

  /**
   * Unpause the player.
   * @returns A promise with a confirmation message
   */
  async unpause () : Promise<string> {
    return new Promise<string>(resolve => {
      if (!this.playing) return resolve('Cannot Unpause: Nothing playing!');
      if (!this.paused) return resolve('Cannot Unpause: Player is not paused!');

      this.paused = false;
      this.setVolume(this.volume);
      this.trackAudioPlayer.unpause();
    });
  }

  /**
   * Set the volume of the player.
   * @param volumeAmount A number to set volume relative to a default value.
   */
  async setVolume (_volumeAmount: number) : Promise<void> {
    // not sure how to implement now
    // this.volume = volumeAmount;
    // this.trackAudioResource.volume(this.volume);
  }

  /**
   * Set playback to a certain timestamp of the track.
   * @param seconds The number of seconds to seek to
   * @returns A promise which resolves to a confirmation message
   */
  async seek (seconds: number) : Promise<string | void> {
    return new Promise<string | void>((resolve, reject) => {
      if (!this.playing) reject(Error('Nothing playing!'));
      if (this.paused) reject(Error('Player is paused!'));
      if (seconds < (this.trackList[this.queuePos].duration)) {
        this.seekTime = seconds;
        this.play(seconds, true);
        return resolve();
      } else {
        return resolve('Can\'t seek this far its too long bitch');
      }
    });
  }

  /**
   * Remove a track at a given index from the queue.
   * @param index Index of track to remove from the queue
   * @returns A promise which resolves to a confirmation messsage
   */
  async remove (index: number) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (isNaN(index)) return reject(Error('Expected a number!'));
      if (index >= this.trackList.length) return reject(Error('Cannot remove: index out of range!'));
      index = Math.floor(index);
      const removedTrack = this.trackList[index];
      this.trackList.splice(index, 1);
      if (this.queuePos > index) this.queuePos--;
      return resolve(`Removed Track ${index + 1}: ${removedTrack.title} [${ConvertSecToFormat(removedTrack.duration)}]`);
    });
  }

  /**
   * Move a track from one position in the queue to an other.
   * @param index1 Origin of track move
   * @param index2 Destination of track move
   * @returns A promise which resolves to a confirmation message
   */
  async move (index1: number, index2: number) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (index1 >= this.trackList.length || index2 >= this.trackList.length) return reject(Error('Cannot move: At least one of indices is out of range!'));
      [this.trackList[index1], this.trackList[index2]] = [this.trackList[index2], this.trackList[index1]];
      if (index2 === this.queuePos) {
        this.play().then(msg => {
          resolve(`Moving track ${index1 + 1} to position ${index2 + 1}\n${msg}`);
        }, err => {
          reject(err);
        });
      } else {
        resolve(`Moving track ${index1 + 1} to position ${index2 + 1}`);
      }
    });
  }

  /**
   * Clear all contents of the queue, apart from current track.
   */
  async clear () : Promise<void> {
    if (this.currentTrack) this.trackList = [this.currentTrack];
    else this.trackList = [];
    this.queuePos = 0;
  }

  /**
   * Get information for the track at a given index.
   * @param pos The position of the track for which to retrieve information
   * @returns A promise which resolves to the embeds containing the information
   */
  async infoEmbed (pos = this.queuePos) : Promise<Discord.MessageEmbed> {
    return new Promise<Discord.MessageEmbed>((resolve, reject) => {
      if (pos >= this.trackList.length) return reject(Error('Track number out of range!'));

      const PROGRESS_BAR_LENGTH = 25;

      const timestampLitteral = pos === this.queuePos ? `&t=${Math.floor(this.timestamp)}` : '';

      const infoEmbed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Track Information')
        .addField('Track Title', `[${this.trackList[pos].title}](${this.trackList[pos].sourceLink}${timestampLitteral}) [${ConvertSecToFormat(this.trackList[pos].duration)}]`);

      try {
        if (pos === this.queuePos && this.currentTrack) {
          let progressBar = '>';
          let i = 0;
          for (; i < Math.round((this.timestamp / (this.currentTrack.duration)) * PROGRESS_BAR_LENGTH); i++) { // if pos is queuepos there is a current track
            progressBar += '█';
          }
          for (; i < PROGRESS_BAR_LENGTH; i++) {
            progressBar += '░';
          }
          progressBar += '<';

          infoEmbed.addField('Track Progress', `${progressBar} \u0009 [${ConvertSecToFormat(Math.round(this.timestamp))} / ${ConvertSecToFormat(this.currentTrack.duration)}]`);
        } else if (pos > this.queuePos && this.currentTrack) {
          let cumulativeSeconds = 0;
          for (let i = 1; i < pos - this.queuePos; i++) cumulativeSeconds += this.trackList[pos + i].duration;
          infoEmbed.addField('Time to Play', `${ConvertSecToFormat((this.currentTrack.duration) - this.timestamp + cumulativeSeconds)}`);
        }

        infoEmbed.addFields([{ name: 'Author', value: this.trackList[pos].author },
          { name: 'Requested by:', value: this.trackList[pos].requestedBy.user.tag }])
          .setImage(this.trackList[pos].icon)
          .setTimestamp();
        return resolve(infoEmbed);
      } catch (err) {
        err.message = `WARNING: Cannot send embed: ${err.message}`;
        logError(err);
        return reject(err);
      }
    });
  }

  /**
   * Toggle track looping
   */
  async toggleTrackLoop () : Promise<void> {
    this.loopTrack = !this.loopTrack;
  }

  /**
   * Toggle queue looping
   */
  async toggleQueueLoop () : Promise<void> {
    this.loopQueue = !this.loopQueue;
  }

  /**
   * Queue an accent (text to speech) action.
   * @param language Language with which to read the text to speech message
   * @param text The text to read out
   * @returns A promise that resolves once accents are finished playing
   */
  async queueAccent (language: string, text: string) : Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.languages.includes(language)) {
        language = 'es';
        text = 'That\'s not a language fucktard!';
      }

      if (DISABLE_ACCENT_QUEUE) this.accentList = [];

      if (text.length > 200) {
        const numIter = Math.ceil(text.length / 200); // ensure correct iteration of for loop
        for (let i = 0; i < numIter; i++) {
          for (let i2 = 200; i2 > 0; i2--) {
            if (text[i2] === ' ') {
              this.accentList.push({ language: language, text: text.slice(0, i2) });
              text = text.slice(i2 + 1); // remove the extra space
              break;
            }
            if (i2 === 1) {
              this.accentList.push({ language: language, text: text.slice(0, 199) });
              text = text.slice(199);
            }
          }
        }
      }

      this.accentList.push({ language: language, text: text });

      this.playAccents().then(() => {
        return resolve();
      }, err => {
        err.message = `WARNING: Cannot play accent! ${err.message}`;
        logError(err);
      });
    });
  }

  /**
   * Play accents in the accents queue.
   * @returns A void promise
   */
  async playAccents () : Promise<void> {
    if (!this.voiceChannel) return Promise.reject(Error('Queue must be bound to a voice channel to play acccents!'));
    if (!this.playingAccent) this.stopTimestamp = null;
    if (this.accentTimeoutId) {
      clearTimeout(this.accentTimeoutId);
      this.accentTimeoutId = undefined;
    }

    if (this.trackAudioPlayer && this.trackAudioPlayer.state.status !== Voice.AudioPlayerStatus.Paused && this.playing) {
      this.stopTimestamp = this.timestamp;
      this.trackAudioPlayer.pause();
    }

    try {
      this.connection = await connectVoice(this.voiceChannel);
    } catch (err) {
      return Promise.reject(err);
    }

    return new Promise<void>((resolve, reject) => {
      this.playingAccent = true;
      this.subscription = this.connection?.subscribe(this.accentAudioPlayer);
      this.accentAudioPlayer.play(Voice.createAudioResource(getTTSLink(this.accentList[0].language, this.accentList[0].text)));
      this.accentAudioPlayer
        .on('stateChange', (oldState, newState) => {
          if (oldState.status === Voice.AudioPlayerStatus.Playing && newState.status === Voice.AudioPlayerStatus.Idle) {
            this.accentList.splice(0, 1);
            if (this.accentList.length === 0) {
              this.playingAccent = false;
              if (this.stopTimestamp) {
                this.play().then(() => {
                  this.seek(this.stopTimestamp ?? 0);
                }).catch(err => {
                  err.message = `WARNING: Cannot resume track after accent! ${err.message}`;
                  logError(err);
                });
              } else {
                this.accentTimeoutId = setTimeout(() => {
                  this.accentAudioPlayer.stop();
                  this.connection?.disconnect();
                  this.connection = null;
                }, 30 * 1000).unref();
              }
              return resolve();
            }
            this.playAccents().catch(err => {
              err.message = `Cannot play accent! ${err.message}`;
              return reject(err);
            });
          }
        })
        .on('error', (err: Error) => {
          err.message = `WARNING: Cannot play accent! ${err.message}`;
          logError(err);
          this.accentList.splice(0, 1);
        });
    });
  }

  /**
   * Delete all connections, close all players, then delete queue for this guild.
   */
  clean () : void {
    this.trackAudioPlayer.stop();
    this.subscription?.unsubscribe();
    this.accentAudioPlayer.stop();
    this.connection?.destroy();
    this.connection = null;
    queueMap.delete(this.guildId);
  }
}

export const queueMap = new Map<string, Queue>();
