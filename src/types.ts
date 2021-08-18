import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders/dist/interactions/slashCommands/SlashCommandBuilder';
import { StageChannel, TextBasedChannels, TextChannel, VoiceChannel } from 'discord.js';

/**
 * Extension of discord.js's Message class, uses custom client with commands collection to allow access to all commands.
 * @extends Discord.Message
 */
export class Message extends Discord.Message {
  // eslint-disable-next-line no-use-before-define
  client: Client;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  constructor (client: Client, data: any) { // cannot access APIMessage type
    super(client, data);
    this.client = client;
  }
}

/**
 * Extension of discord.js's Interaction class, uses custom client with commands collection to allow access to all commands.
 * @extends Discord.Interaction
 */
export class Interaction extends Discord.Interaction {
  // eslint-disable-next-line no-use-before-define
  client: Client;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  constructor (client: Client, data: any) { // cannot access APIMessage type
    super(client, data);
    this.client = client;
  }
}

/**
 * Extension of discord.js's Command Interaction class, uses custom client with commands collection to allow access to all commands.
 * @extends Discord.CommandInteraction
 */
export class CommandInteraction extends Discord.CommandInteraction {
  // eslint-disable-next-line no-use-before-define
  client: Client;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  constructor (client: Client, data: any) { // cannot access APIMessage type
    super(client, data);
    this.client = client;
  }
}
/**
 * Extension of discord.js's Command Interaction class, promises ts that the Interaction is complete (Does not only use the Discord API response).
 * @extends Discord.CommandInteraction
 */
export interface CInteraction extends CommandInteraction {
  member: Discord.GuildMember
  readonly channel: TextBasedChannels
}

/**
 * Extension of our Complete Interaction class, promises ts that the Interaction is in a guild.
 * @extends CInteraction
 */
interface _GuildCInteraction extends CInteraction {
  readonly guild: Discord.Guild
  readonly channel: TextChannel
}

/**
 * Extension of discord.js's Voice class, promises ts that the VoiceChannel exists.
 * @extends Discord.VoiceState
 */
interface VoiceState extends Discord.VoiceState {
  readonly channel: VoiceChannel | StageChannel
}

/**
 * Extension of discord.js's GuildMember class, promises ts that the member is in a VoiceChannel.
 * @extends Discord.GuildMember
 */
interface GuildMember extends Discord.GuildMember {
  readonly voice: VoiceState
}

/**
 * Extension of our Guild interaction class, promises ts that the guild member is in a VoiceChannel.
 * @extends _GuildCInteraction
 */
export interface VoiceCInteraction extends _GuildCInteraction {
  readonly member: GuildMember
}

/**
 * Type of any Guild Complete Interaction as the user may or may not be in a voice channel.
 */
export type GuildCInteraction = _GuildCInteraction | VoiceCInteraction

/**
 * Type of all bomboclaat modules. These modules are loaded from the `./commands` folder.
 */
export interface bomboModule {

  /**
   * The name of the command, used to display in the slash command tab.
   */
  readonly name: string;

  /**
   * Description of the command used for the slash command.
   */
  readonly description: string;

  /**
   * The individual arguments and choices for the slash command.
   */
  readonly slashCommand: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  // SlashCommandBuilder

  /**
   * Whether or not the command can be used outside of guilds. Even with this property correctly set, an `if`
   * guard must be used to verify `message.guild` is defined before using it in commands.
   */
  readonly dmCompatible: boolean;

  /**
   * Check that the user is connected to a voice channel before running the command.
   * Also checks that bot is allowed to connect and speak to said voice channel.
   */
  readonly voiceConnection: boolean;

  /**
   * Centralise commands usage with this property set to true to one text channel to prevent covert command usage
   * in other text channels.
   */
  readonly textBound: boolean;

  /**
   * Will ignore bot channel and allow the command to be run anywhere.
   */
  readonly ignoreBotChannel: boolean;

  /**
   * Run the bomboModule command asynchronously.
   * @param interaction The Interaction that started the command.
   */
  execute(interaction: Discord.CommandInteraction): Promise<void>;
  execute(interaction: CInteraction): Promise<void>;
  execute(interaction: GuildCInteraction): Promise<void>;
  execute(interaction: VoiceCInteraction): Promise<void>;

}

/**
 * Extension of discord.js Client class, creates a command property, whose value is a `Discord.Collection` mapping command names to bomboModules.
 * @extends Discord.Client
 */
export class Client extends Discord.Client {
    commands: Discord.Collection<string, bomboModule>;
    constructor (ClientOptions: Discord.ClientOptions) {
      super(ClientOptions);
      this.commands = new Discord.Collection();
    }
}
