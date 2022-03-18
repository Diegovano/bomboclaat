"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = exports.Client = exports.Message = void 0;
const Discord = __importStar(require("discord.js"));
/**
 * Extension of discord.js's Message class, uses custom client with commands collection to allow access to all commands.
 * @extends Discord.Message
 */
class Message extends Discord.Message {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    constructor(client, data) {
        super(client, data);
        this.client = client;
    }
}
exports.Message = Message;
/**
 * Extension of discord.js Client class, creates a command property, whose value is a `Discord.Collection` mapping command names to bomboModules.
 * @extends Discord.Client
 */
class Client extends Discord.Client {
    constructor(ClientOptions) {
        super(ClientOptions);
        this.commands = new Discord.Collection();
    }
}
exports.Client = Client;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms).unref());
exports.wait = wait;
//# sourceMappingURL=types.js.map