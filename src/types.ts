import * as Discord from 'discord.js';

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
  readonly slashCommand: unknown;
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
