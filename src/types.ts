import * as Discord from 'discord.js';

/**
 * Extension of discord.js's Message class, uses custom client with commands collection to allow access to all commands.
 * @extends Discord.Message
 */
export class Message extends Discord.Message {
  // eslint-disable-next-line no-use-before-define
  client: Client;
  constructor (client: Client, data: unknown, channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel | Discord.ThreadChannel) {
    super(client, data, channel);
    this.client = client;
  }
}

/**
 * Type of all bomboclaat modules. These modules are loaded from the `./commands` folder.
 */
export interface bomboModule {

  /**
   * The name of the command, used to display in the help embed for example.
   */
  readonly name: string;

  /**
   * Array of aliases that can be used to reference this command. Caution, there is no check for duplicate aliases.
   * If two commands have identical aliases unexpected behaviour could occur.
   */
  readonly aliases?: string[];

  /**
   * Description of the command used in the help embed.
   */
  readonly description?: string;

  /**
   * The number of arguments to check the user has entered. For no argument check, use `null`.
   */
  readonly args: number | null;

  /**
   * If args is not null, explain what each arg is, whether it is optional (using `[` and `]` around a description
   * of the argument) for mandatory arguments use `<` and `>`.
   */
  readonly usage: string | null;

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
   * Run the bomboModule command asynchronously.
   * @param message the message that invoked the command
   * @param args the arguments that the user may or may not have given
   */
  execute(message: Message, args: string[]): Promise<void>;
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
