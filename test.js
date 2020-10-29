const fs = require(`fs`);
process.env.TEST = true;
var tests;     // Ingore Eslint, they are used
var count;
const {prefix} = require("./index.js");