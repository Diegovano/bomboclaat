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
const configFiles_1 = require("../configFiles");
const log_1 = require("../log");
exports.module = {
    name: 'setaccent',
    description: 'Assign yourself an in-chat accent',
    args: 1,
    usage: '<language>',
    dmCompatible: false,
    voiceConnection: true,
    textBound: false,
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            configFiles_1.config.accentUser(message, args[0]).catch((err) => {
                err.message = `WARNING: Could not update user accent! ${err.message}`;
                (0, log_1.logError)(err);
            });
        });
    }
};
//# sourceMappingURL=setaccent.js.map