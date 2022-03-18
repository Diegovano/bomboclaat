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
exports.logError = exports.log = void 0;
const fs_1 = require("fs");
function pad(num) {
    let s = num.toLocaleString() + '';
    while (s.length < 2)
        s = '0' + s;
    return s;
}
function log(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateOb = new Date();
        console.log(`[${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}] INFO: ${text}`);
    });
}
exports.log = log;
function logError(error) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateOb = new Date();
        console.error(`[${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}] ${error.message}`);
        (0, fs_1.appendFile)(`./logs/${dateOb.getFullYear()}-${pad(dateOb.getMonth() + 1)}-${pad(dateOb.getDate())}.log`, `${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}\n${error.stack}\n\n`, function (appErr) {
            if (appErr) {
                if (appErr)
                    log('Cannot create file in ./logs directory. Attempting to create!');
                (0, fs_1.mkdir)('./logs', (dirErr) => {
                    if (dirErr) {
                        logError(Error(`SEVERE: Unable to write to ./logs directory! ${appErr.message}`));
                        logError(Error(`SEVERE: Unable to create ./logs directory! ${dirErr.message}`));
                    }
                    log('./logs directory successfully created!');
                    (0, fs_1.appendFile)(`./logs/${dateOb.getFullYear()}-${pad(dateOb.getMonth() + 1)}-${pad(dateOb.getDate())}.log`, `${pad(dateOb.getHours())}:${pad(dateOb.getMinutes())}:${pad(dateOb.getSeconds())}\n${error.stack}\n\n`, function (appErr) {
                        if (appErr)
                            throw Error('FATAL: CANNOT LOG ERRORS');
                    });
                });
            }
        });
    });
}
exports.logError = logError;
//# sourceMappingURL=log.js.map