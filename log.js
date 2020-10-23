const fs = require(`fs`);

function pad(num)
{
    var s = num + ``;
    while (s.length < 2) s = `0` + s;
    return s;
}

async function log(text)
{
    let date_ob = new Date();

    console.log(`[${pad(date_ob.getHours())}:${pad(date_ob.getMinutes())}:${pad(date_ob.getSeconds())}] INFO: ${text}`);
}

async function logError(error)
{
    var date_ob = new Date();

    console.error(`[${pad(date_ob.getHours())}:${pad(date_ob.getMinutes())}:${pad(date_ob.getSeconds())}] ${error.message}`); 

    fs.appendFile(`./logs/${date_ob.getFullYear()}-${date_ob.getDate()}-${date_ob.getMonth() + 1}.log.txt`, `\n\n${pad(date_ob.getHours())}:${pad(date_ob.getMinutes())}:${pad(date_ob.getSeconds())}\n${error.stack}`, function(app_err)
    {
        if (app_err)
        {
            if (app_err) log(`Cannot create file in ./logs directory. Attempting to create!`);
            fs.mkdir(`./logs`, (dir_err) =>
            {
                if (dir_err) 
                {
                    logError(`SEVERE: Unable to write to ./logs directory! ${app_err.message}`);
                    logError(`SEVERE: Unable to create ./logs directory! ${dir_err.message}`);
                }

                log(`./logs directory successfully created!`);
                fs.appendFile(`./logs/${date_ob.getFullYear()}-${date_ob.getDate()}-${date_ob.getMonth() + 1}.log.txt`, `${pad(date_ob.getHours())}:${pad(date_ob.getMinutes())}:${pad(date_ob.getSeconds())}\n${error.stack}\n\n`, function(app_err)
                {
                    if (app_err) throw `FATAL: CANNOT LOG ERRORS`;
                });
            });
        }
    });
}

exports.log = log;
exports.logError = logError;