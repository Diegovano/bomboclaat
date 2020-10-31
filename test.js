const fs = require(`fs`);
const l = require("./log.js");
const path = require('path');

function getLineBreakChar(string) 
{
    const indexOfLF = string.indexOf('\n', 1);  // No need to check first-character

    if (indexOfLF === -1) 
    {
        if (string.indexOf('\r') !== -1) return '\r';

        return '\n';
    }

    if (string[indexOfLF - 1] === '\r') return '\r\n';

    return '\n';
}

const str_tests = fs.readFileSync(path.join('tests','test-commands.txt'), `utf8`);   // Write all commands in here

global.tests = str_tests.split(getLineBreakChar(str_tests));     // Runs in whatever line ending you want

global.count = 0;

const index_stats = fs.statSync("index.js");
const built_stats = fs.statSync("built_test.js");

if (built_stats.ctimeMs - index_stats.ctimeMs <= 0)     // If index.js was modified after build
{
    l.logError(Error(`SEVERE: Index.js was changed after Test.js was built. Please run "npm run build".`));
}
else
{
    require("./built_test.js");
}
