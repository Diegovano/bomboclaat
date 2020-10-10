module.exports =
{
    name: `accent`,
    aliases: [`a`],
    description: `Fuck diegos descriptions`,
    usage: `fuck diegos usage`,
    async execute(message, args)
    {
        var languages = ['french', 'german', 'russian', 'japanese', 'chinese', 'english', 'arabic', 'italian', 'spanish', 'korean', 'portuguese', 'swedish', 'dutch', 'nz', 'aussie', 'quebec', 'indian', 'american', 'welsh'];

        var lang;
        var msgs = [];
        var ms = args.slice(1, args.length).toString().replace(/,/gi, '+');

        switch(args[0])
        {
            case languages[0]:
                lang = 'fr';
                break;
            case languages[1]:
                lang = 'de';
                break;
            case languages[2]:
                lang = 'ru';
                break;
            case languages[3]:
                lang = 'ja';
                break;
            case languages[4]:
                lang = 'zh';
                break;
            case languages[5]:
                lang = 'en';
                break;
            case languages[6]:
                lang = 'ar';
                break;
            case languages[7]:
                lang = 'it';
                break;
            case languages[8]:
                lang = 'es';
                break;
            case languages[9]:
                lang = 'ko';
                break;
            case languages[10]:
                lang = 'pt';
                break;
            case languages[11]:
                lang = 'sw';
                break;
            case languages[12]:
                lang = 'nl';
                break;
            case languages[13]:
                lang = 'en_nz';
                break;
            case languages[14]:
                lang = 'en_au';
                break;
            case languages[15]:
                lang = 'fr_ca';
                break;
            case languages[16]:
                lang = 'hi';
                break;
            case languages[17]:
                lang = 'en_us';
                break;
            default:
                message.channel.send("That's not a language fucktard");
                lang = 'es';
                ms = 'thats+not+a+language+fucktard';
                break;
        }


        while (ms.length > 203)
        {
            msgs.push(ms.slice(0,203));
            ms = ms.slice(203, ms.length);
            console.log(ms, msgs);
        }
        msgs.push(ms);

        if (message.member.voice.channel)
        {
            const connection = await message.member.voice.channel.join();
            for(var i = 0; i < msgs.length; i++)
            {
                var link = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + lang + '&q=' + msgs[i];
                const dispatcher = connection.play(link);
                // check if i need to make some sort of await
                // gonna push cos i got no battery left
            }
        }
        else
        {
            message.reply('You need to join a voice channel first!');
        }
    }
};
