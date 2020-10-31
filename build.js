const fs = require(`fs`);
const l = require("./log.js");
const path = require("path");

// Builds built_test.js by using index.js and modifying certain bits at // DO_NOT_REMOVE

var index = fs.readFileSync(`./index.js`, `utf8`, (err, data) => // Get index so we can build new test file
{
    if (err) l.log("Cannot read index.js!");
});

const TEST_FUNC1 = fs.readFileSync(path.join(`tests`,`Func1`), `utf8`, (err, data) =>
{
    if (err) l.log("Cannot read test Func1!");
});

const TEST_FUNC2 = fs.readFileSync(path.join(`tests`,`Func2`), `utf8`, (err, data) =>
{
    if (err) l.log("Cannot read test Func2!");
});

// Format string correctly

var new_index = index.split("// DO_NOT_REMOVE:ADD TEST_FUNC1")[0];
new_index += TEST_FUNC1;
new_index += index.substring(index.indexOf("// DO_NOT_REMOVE:ADD TEST_FUNC1"),index.indexOf("// DO_NOT_REMOVE:ADD TEST_FUNC2"));
new_index += TEST_FUNC2;
new_index += index.substring(index.indexOf("// DO_NOT_REMOVE:ADD TEST_FUNC2"),index.indexOf("// DO_NOT_REMOVE:RM INDEX_FUNC1"));
new_index += index.substring(index.indexOf("// DO_NOT_REMOVE:RM INDEX_FUNC2"));

fs.writeFile('built_test.js', new_index, function (err) 
{
    if (err) return console.log(err);
});
