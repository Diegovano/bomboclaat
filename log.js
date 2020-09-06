function pad(num)
{
    var s = num + ``;
    while (s.length < 2) s = `0` + s;
    return s;
}

exports.log = ( text =>
    {
        let date_ob = new Date();

        console.log(`[${pad(date_ob.getHours())}:${pad(date_ob.getMinutes())}:${pad(date_ob.getSeconds())}] INFO: ${text}`);
    });

exports.logError = ( text =>
    {
        let date_ob = new Date();

        console.error(`[${pad(date_ob.getHours())}:${pad(date_ob.getMinutes())}:${pad(date_ob.getSeconds())}] ${text}`);    
    });