const Discord = require('discord.js');
const snoowrap = require('snoowrap');
const cheerio = require('cheerio');
const request = require('request');
const ytdl = require('ytdl-core');
const fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
const search = require('youtube-search');
var fetchVideoInfo = require('youtube-info');
var stringify = require('json-stringify-safe');

var queue = new Map();
const bot  = new Discord.Client();
const token = 'Njk3NTA0MTIxNzk1NjQxNDU1.Xo8BXg.xG8ZOQU26vUrzY1GwxHbSMw8F4Q';


var queueContruct;
var resultsVideo;
var song;
var numbers = ["1","2","3","4","5"];
var duration;
var allSongs;
var songIndex;
var serverQueue;
var serverPlaylists;
var allPlaylists;
var args;

async function scrapeSubreddit(sub, message) {

    const r = new snoowrap({
        userAgent: 'bomboclaat',
        clientId: '6kQ6VTe9QqcAyA',
        clientSecret: '-dh2mD0cz1PRgBy8_N_1jkHmkQk',
        refreshToken: '250586588807-UI_ADnAYRcoWsyGyyUPDjt0nadw'
    });

    try{
        const subreddit = await r.getSubreddit(sub);
        const topPosts = await subreddit.getNew({time: 'day', limit: 50});

        let data = [];

        topPosts.forEach((post) => {
            data.push({
                link: post.url,
                text: post.title,
                score: post.score
            })
        });
        message.channel.send(data[Math.floor(Math.random() * data.length)].link);
    } catch {
        message.channel.send('**This subreddit was not found.**');
    }
}

function get_total_duration(durations){
    var total_duration = 0;
    for (i = 0; i < durations.length; i++){
        if (durations[i] == 0){
            return `The queue will never end`
        } else {
            total_duration += durations[i];
        }
    }
    console.log(secs_to_mins(total_duration));
    return secs_to_mins(total_duration, true);
}

function secs_to_mins(secs, queue){
    var ouput;
    var minutes = 0;
    var hours = 0;
    var seconds = secs;
    var thing;

    if (queue){
        thing = `Queue duration`;
    } else {
        thing = `Song duration`;
    }

    while (seconds >= 60){
        minutes ++;
        seconds -= 60;
    }

    if (seconds < 10){
        seconds = `0${seconds}`;
    }
    while (minutes >= 60){
        hours ++;
        minutes -= 60;
    }
    if (hours > 0){
        if (minutes < 10){
            minutes = `0${minutes}`
        }
        output = `${thing}: ${hours}:${minutes}:${seconds}`;
    } else if (seconds == "00"){
        output = `This song is a livestream`;

    }else {
        output = `${thing}: ${minutes}:${seconds}`;
    }
    return output;
}


function playlist_add(message,playlistTerms,serverPlaylists){


    for (i = 0; i < serverPlaylists.length; i++){
        if (serverPlaylists[i].memberId == message.author.id){
            if (playlistTerms != serverPlaylists[i].memberPlaylist){

                var termIndex = searchTermYT(playlistTerms,message,true);

                var playlistSong = {
                    songName: playlistTerms,
                    index: termIndex
                }

                console.log(playlistSong)
                serverPlaylists[i].memberPlaylist.push(playlistSong);


            } else {
                message.channel.send("you can't add the same song twice! ");
            }
        }
    }
}



async function play_from_file(index,message, args){

    let rawdata = fs.readFileSync('urlYT.json');
    let resultsVideo = JSON.parse(rawdata);
    fs.writeFileSync('urlYT.json', "");

    var title  = resultsVideo[index].title
        .replace(/&amp;/gi, '&')
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"');

    var link = resultsVideo[index].link;
    var id =  resultsVideo[index].id;
    var video_duration;
    console.log(title, link);

    song = {
        title: title,
        url: link,
        id: id
    };



    const voiceChannel = message.member.voice.channel;
    serverQueue = queue.get(message.guild.id);

    //logging in
    async function execute(message, serverQueue) {

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel){
            return message.channel.send(
                "You need to be in a voice channel to play music!"
            );
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send("I need the permissions to join and speak in your voice channel!");
        }
    }

    execute(message,serverQueue);
    //const songInfo = await ytdl.getInfo(args[1]);


    if (!serverQueue) {


        // Creating the contract for our queue
        queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        console.log(queueContruct.songs + " This is the queue");
        // Setting the queue using our contract
        queue.set(message.guild.id, queueContruct);
        // Pushing the song to our songs array
        queueContruct.songs.push(song);


        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            // Calling the play function to start a song
            play(message.guild, queueContruct.songs[0], message);
        } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
    else {
        serverQueue.songs.push(song);

    }


    try{
        allSongs[songIndex].songs = serverQueue.songs;
    }
    catch{
        allSongs[songIndex].songs = [song];
    }

    fs.writeFileSync("songs.json",JSON.stringify(allSongs));


    // commentnsole.log(serverQueue.songs);
    const play_embed = new Discord.MessageEmbed()
          .setTitle('Added to queue:')
          .addField('Title:', song.title)
          .addField('Link:', song.url)
          .setThumbnail("https://img.youtube.com/vi/" + song.id + "/default.jpg" )
          .setColor('#335f80');

    message.channel.send(play_embed)
        .then(m => {
            m.react('➕')

            const filter = (reaction, user) => reaction.emoji.name == '➕'  && user.id === message.author.id ;
            const collector = m.createReactionCollector(filter, { max: 2, time: 5 * 60 * 1000 });

            collector.on('collect', () => {
                playlist_add(message,args.slice(1, args.length).toString(),serverPlaylists);
            })

        })
}

function searchTermYT(searchTerm,message,playlistUse=false){
    var opts = {
        maxResults: 10,
        key: 'AIzaSyBp6MTZWJElKY-rhQb89VZ1o7aGKx-q-WM',
    };

    try{
        term = searchTerm.replace(/,/gi,' ');
    }
    catch{
        return;
    }

    search(term, opts, async function(err, result) {
        if(err) return console.log(err);
        var index = 0;
        var resultsVideo = []


        for (i = 0; i < 10; i++){
            if (resultsVideo.length >= 5){
                break;
            }
            if(result[i].kind !== 'youtube#video'){
                index++;
            } else {
                resultsVideo.push(result[i]);
            }
        }

        let data = JSON.stringify(resultsVideo);
        fs.writeFileSync('urlYT.json', data);

        const song_choice = new Discord.MessageEmbed()
              .setTitle('Choose your song: ')
              .setColor('#335f80');

        for (i = 0; i < resultsVideo.length; i++){
            song_choice.addField(`${i+1} - ` + resultsVideo[i].title.replace(/&amp;/gi, '&').replace(/&#39;/gi, "'").replace(/&quot;/gi, '"'), "Channel: "  + resultsVideo[i].channelTitle)
        }
        message.channel.send(song_choice)
            .then(m => {
                var numbers_react = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
                m.react('1️⃣');
                m.react('2️⃣');
                m.react('3️⃣');
                m.react('4️⃣');
                m.react('5️⃣');

                const filter1 = (reaction, user) => reaction.emoji.name == '1️⃣'  && user.id === message.author.id ;
                const collector1 = m.createReactionCollector(filter1, { max: 2, time: 5 * 60 * 1000 });


                collector1.on('collect', () => {
                    if (!playlistUse){
                        play_from_file(0,message);
                    }else{
                        return 0;
                    }
                })

                const filter2 = (reaction, user) => reaction.emoji.name == '2️⃣'  && user.id === message.author.id ;
                const collector2 = m.createReactionCollector(filter2, { max: 2, time: 5 * 60 * 1000 });


                collector2.on('collect', () => {
                    if (!playlistUse){
                        play_from_file(1,message);
                    }else{
                        return 1;
                    }
                })

                const filter3 = (reaction, user) => reaction.emoji.name == '3️⃣'  && user.id === message.author.id ;
                const collector3 = m.createReactionCollector(filter3, { max: 2, time: 5 * 60 * 1000 });


                collector3.on('collect', () => {
                    if (!playlistUse){
                        play_from_file(2,message);
                    }else{
                        return 2;
                    }
                })

                const filter4 = (reaction, user) => reaction.emoji.name == '4️⃣'  && user.id === message.author.id ;
                const collector4 = m.createReactionCollector(filter4, { max: 2, time: 5 * 60 * 1000 });


                collector4.on('collect', () => {
                    if (!playlistUse){
                        play_from_file(3,message);
                    }else{
                        return 3;
                    }
                })

                const filter5 = (reaction, user) => reaction.emoji.name == '5️⃣'  && user.id === message.author.id ;
                const collector5 = m.createReactionCollector(filter5, { max: 2, time: 5 * 60 * 1000 });


                collector5.on('collect', () => {
                    if (!playlistUse){
                        play_from_file(4,message);
                    }else{
                        return 4;
                    }
                })

                m.edit(song_choice);
                m.delete({timeout : 10000});
            })
            .catch(err => console.error(err))

        if (message.content.startsWith(`${PREFIX}play`) || message.content.startsWith('${PREFIX}p')){
            message.delete();
        }
    });
}

function play(guild, song, message) {

    const serverQueue = queue.get(message.guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(message.guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
          .play(ytdl(song.url))
          .on("finish", () => {
              serverQueue.songs.shift();
              allSongs[songIndex].songs = serverQueue.songs;
              fs.writeFileSync("songs.json",JSON.stringify(allSongs));

              play(guild, serverQueue.songs[0], message);
          })
          .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Started playing: **${song.title}**`)
        .then(msg =>{
            msg.delete({timeout: 10000});
        })
    console.log(`${song.title} has started playing`);
}


// Uses prefix

bot.on('ready', () =>{
    console.log('this bot is online!');
    bot.user.setActivity('Fuck you Hugo');
})

bot.on('message', async message => {

    var allPrefixes = JSON.parse(fs.readFileSync('prefixes.json'));


    for (var h = 0; h < allPrefixes.length; h++){
        if (allPrefixes[h].id === message.guild.id){
            PREFIX = allPrefixes[h].prefix;
            break;
        }
    }

    if (h === allPrefixes.length){
        serverId = message.guild.id;
        allPrefixes.push({
            id : serverId,
            prefix: '|'
        });

        PREFIX = '|';
    }


    allSongs = JSON.parse(fs.readFileSync('songs.json'));


    for (songIndex = 0; songIndex < allSongs.length; songIndex++){
        if (allSongs[songIndex].id === message.guild.id){
            try{
                serverQueue.songs = allSongs[songIndex].songs;
                break;
            }catch{
                break;
            }
        }
    }

    if (songIndex === allSongs.length ){

        allSongs.push({
            id : message.guild.id,
            songs: []
        });

        try{
            serverQueue.songs = [];
        }catch{
        }
    }


    if (!message.content.startsWith(PREFIX)) return;
    args = message.content.slice(PREFIX.length).split(" ");
    var queuee = queue.get(message.guild.id);



    let rawdata = fs.readFileSync('allPlaylists.json');
    allPlaylists = JSON.parse(rawdata);

    for (var h = 0; h < allPlaylists.length; h++){
        if (allPlaylists[h].id === message.guild.id){
            serverPlaylists = allPlaylists[h].playlists;
            break;
        }
    }

    if (h === allPlaylists.length){
        serverId = message.guild.id;
        allPlaylists.push({
            id : serverId,
            playlists: []
        });
        serverPlaylists = [];
    }

    iterator = message.guild.members.cache.values();

    length = serverPlaylists.length;
    if (typeof length == 'undefined'){
        length = 0;
    }

    while (length < message.guild.members.cache.size){

        length ++;

        serverPlaylists.push(
            {
                memberId: iterator.next().value.user.id,
                memberPlaylist: []
            }
        );
    }

    if (h === allPlaylists.length){
        allPlaylists[h].playlists.push({serverPlaylists});
    } else {
        allPlaylists[h].playlists = serverPlaylists;
    }

    fs.writeFileSync('allPlaylists.json', JSON.stringify(allPlaylists));


    switch(args[0].toLowerCase()){

    case 'h':
    case 'help':
        function help(){
            let commands = ['help or h', 'info', 'insult', 'bg', 'search', 'play or p', 'skip or s', 'queue or q']
            const help_embed = new Discord.MessageEmbed()
                  .setTitle('Commands')
                  .addField(commands[0], 'Lists commands (this)')
                  .addField(commands[1], 'Gives a bit of information about the command caller')
                  .addField(commands[2], 'Insults the command caller')
                  .addField(commands[3], 'Tells you how beautiful you are')
                  .addField(commands[4], 'Searches for an image on the webternets')
                  .addField(commands[5], 'Plays a song')
                  .addField(commands[6], 'Skips a song')
                  .addField(commands[7], 'Shows the queue')
                  .setColor(0x366625)
                  .setThumbnail('https://i.pinimg.com/originals/d1/91/86/d191860d0ab59a74fb57de99b5fb2d80.jpg');

            message.channel.send(help_embed);
        }
        help();
        break;

    case 'info':
        var sexuality = 'Straight';
        if(message.author.username === 'Powered By Salt'){
            sexuality = 'straight';
        } else if (message.author.username === 'Terminator00702'){
            sexuality = 'poof';
        } else if (message.author.username === 'Gabriele'){
            sexuality = 'oMnisexual';
        }else if (message.author.username === 'Jacko'){
            sexuality = 'Penguin';
        }
        const embed = new Discord.MessageEmbed()
              .setTitle('User info')
              .addField('Player Name', message.author.username)
              .addField('Sexuality', sexuality)
              .addField('The best server in the world:', message.guild.name)
              .setColor(0xF1C40F)
              .setThumbnail(message.author.displayAvatarURL());
        message.channel.send(embed);
        break;

    case 'insult':
        var insults = ['you burnt piece of celery.', 'you cunt.','you SIMP.','you Smol BRaIn.', 'you idiot sandwich.'];

        var a = fs.readFileSync('slurs.txt', 'utf8', function(err, data) {
            if (err) throw err;
            console.log(data);
        });

        insults = a.split("\n");

        if (args[1]){
            if (args[1][0] == '<'){
                message.channel.send('Fuck you '+ message.mentions.users.first().username + ' you ' +  insults[Math.floor(Math.random()*insults.length)]);
            }
        } else {
            message.channel.send('Fuck you '+ message.author.username + ' you ' +  insults[Math.floor(Math.random()*insults.length)]);
        }
        break;

    case 'bg':
        if (message.author.username === 'Powered By Salt'){
            message.channel.send("We don't care abou't your opinion hugo.");
        } else if (message.author.username === 'Jesus du 89'){
            message.channel.send("En effet c'est toi le plus beau du monde entier");
        }else if (message.author.username === 'Gabriele'){
            message.channel.send("Puta Troya de Mierda");
        } else {
            message.channel.send("Decidément.");
        }
        break;

    case 'search':

        if (!args[1]){
            message.channel.send('no 2nd arg given');
        } else {

            // SEARCH GOOGLE

            let options = {
                url: "https://www.dogpile.com/serp?qc=images&q=" + args.slice(1, args.length).toString(),
                method: "GET",
                headers: {
                    "Accept": "text/html",
                    "User-Agent": "Chrome"
                }
            };
            request(options, function(error, response, responseBody){
                if (error) {
                    return;
                }

                $ = cheerio.load(responseBody);

                var links = $(".image a.link");
                var urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr("href"));

                console.log(urls);
                if (!urls.length){
                    return;
                }
                message.channel.send(urls[Math.floor(Math.random() * urls.length)]);
            })
            break;
        }

        // MUSIC PART

    case 'p':
    case 'play':

        if (!args[1]){
            message.channel.send('please provide a song');
            return;

        } else if(numbers.includes(args[1])){
            play_from_file(parseInt(args[1]-1),message);
        } else {
            searchTermYT(args.slice(1, args.length).toString(),message,false);
        }
        break;

    case 's':
    case 'skip':

        console.log('Skipping track.')
        function skip(message, serverQueue) {
            if (!message.member.voice.channel){
                return message.channel.send(
                    "You have to be in a voice channel to stop the music!"
                );
            }
            if (!serverQueue){
                return message.channel.send("There is no song that I could skip!");
            }
            const skip_embed = new Discord.MessageEmbed()
                  .setThumbnail("https://img.youtube.com/vi/" + serverQueue.songs[0].id + "/default.jpg" )
                  .setTitle('Skipped track:')
                  .addField('Song',serverQueue.songs[0].title)
                  .setColor('#b83d45');


            console.log(queueContruct.songs[0].id);

            message.channel.send(skip_embed);
            serverQueue.connection.dispatcher.end();

        }

        serverQueue = queue.get(message.guild.id);

        skip(message,serverQueue);

        allSongs[songIndex].songs = serverQueue.songs;
        fs.writeFileSync("songs.json",JSON.stringify(allSongs));

        break;

    case 'quit':
    case 'leave':
        var serverQueue = queue.get(message.guild.id);
        serverQueue.voiceChannel.leave();
        queue.delete(message.guild.id);
        break;

    case 'q':
    case 'queue':
        console.log(allSongs[songIndex].songs);
        if (!allSongs[songIndex].songs || allSongs[songIndex].songs.length === 0){
            message.channel.send('there is no available queue');
        } else {
            var durations = []
            console.log(allSongs[songIndex].songs);

            for (i = 0; i < allSongs[songIndex].songs.length; i++){
                var index = 0;
                await fetchVideoInfo(allSongs[songIndex].songs[i].id).then(async function (videoInfo) {
                    index++;

                    let data = videoInfo.duration;
                    console.log(data + " length")

                });
            }


            const queue_embed = new Discord.MessageEmbed()
                  .setTitle('Queue')
                  .setColor('#5e0ed1')
                  .setFooter(get_total_duration(durations));

            for (i = 0; i < allSongs[songIndex].songs.length; i++){
                queue_embed.addField(allSongs[songIndex].songs[i].title, secs_to_mins(durations[i]))
            }

            message.channel.send(queue_embed);
        }
        break;

    case 'playlist':

        try{
            var playlistTerms = args.slice(2, args.length).toString().replace(/,/gi,' ');
        }catch{
            var playlistTerms = args.slice(2, args.length).toString();
        }

        if (args[1] == 'add'){
            playlist_add(message,playlistTerms,serverPlaylists)
        } else if (args[1] == 'play'){
            for (i = 0; i < serverPlaylists.length; i++){
                if (serverPlaylists[i].memberId == message.author.id){
                    for (song in serverPlaylists[i].memberPlaylist){


                    }
                }
            }
        }

        if (h === allPlaylists.length){
            allPlaylists[h].playlists.push({serverPlaylists});
        } else {
            allPlaylists[h].playlists = serverPlaylists;
        }

        fs.writeFileSync('allPlaylists.json', JSON.stringify(allPlaylists));
        break;

    case 'stop':
    case 'pause':

        if(!queueContruct.playing){
            message.channel.send("**the player is already paused**");
        } else {
            queuee.connection.dispatcher.pause();
            queueContruct.playing = false;
            message.channel.send("**player paused**");
        }

        break;

    case 'resume':
    case 'unpause':
    case 'continue':

        if(queueContruct.playing){
            message.channel.send("**the player is already playing**");
        } else {
            queuee.connection.dispatcher.resume();
            queueContruct.playing = true;
            message.channel.send('**player resumed**');
        }
        break;

    case 'volume':
        queuee.connection.dispatcher.setVolume(args[1]);
        break;

    case 'prefix':

        if(!args[1]){
            message.channel.send("**You have to change the prefix to something**");
        } else if (args[1].length > 3){
            message.channel.send("The prefix must be only a maximum of three characters long.");
        } else {
            var allPrefixes = JSON.parse(fs.readFileSync('prefixes.json'));

            for (var h = 0; h < allPrefixes.length; h++){
                if (allPrefixes[h].id === message.guild.id){
                    allPrefixes[h].prefix = args[1];
                    break;
                }
            }

            if (h === allPrefixes.length){
                serverId = message.guild.id;
                allPrefixes.push({
                    id : serverId,
                    prefix: args[1]
                });
            }

            PREFIX = args[1];

            message.channel.send(`**Prefix has been changed to ${PREFIX}**`);

            fs.writeFileSync('prefixes.json',JSON.stringify(allPrefixes));
        }


        break;

    case 'pp':
        var cock = []
        cock.push("8");
        for (i = 0; i <  Math.floor(Math.random() * 50); i++){
            cock.push("=");
        }
        cock.push("D");
        if (args[1] == '<@!244920561443012608>'){
            message.channel.send(message.mentions.users.first().username + 's cock size is:\n8¬');
        } else if (args[1]){
            if (args[1][0] == '<'){
                message.channel.send(message.mentions.users.first().username + 's cock size is:\n' + cock.toString().replace(/,/gi, ""));
            }
        } else {
            message.channel.send(message.author.username + "'s cock size is:\n" + cock.toString().replace(/,/gi, ""));
        }
        break;

    case 'poop':
        message.channel.send("░░░░░░░░░░░█▀▀░░█░░░░░░\n░░░░░░▄▀▀▀▀░░░░░█▄▄░░░░\n░░░░░░█░█░░░░░░░░░░▐░░░\n░░░░░░▐▐░░░░░░░░░▄░▐░░░\n░░░░░░█░░░░░░░░▄▀▀░▐░░░\n░░░░▄▀░░░░░░░░▐░▄▄▀░░░░\n░░▄▀░░░▐░░░░░█▄▀░▐░░░░░\n░░█░░░▐░░░░░░░░▄░█░░░░░\n░░░█▄░░▀▄░░░░▄▀▐░█░░░░░\n░░░█▐▀▀▀░▀▀▀▀░░▐░█░░░░░\n░░▐█▐▄░░▀░░░░░░▐░█▄▄░░\n░░░▀▀░▄TSM▄░░░▐▄▄▄▀░░░")
        break;

    case 'reddit':
        scrapeSubreddit(args.slice(1, args.length).toString().replace(/,/gi, " "), message);
        break;

    case 'meme':
        scrapeSubreddit('memes', message);
        break;

    case 'game':
        if (!args[1]){
          message.channel.send('Specify the game you want to play!')
        }else{
          var game = "";
          if (args[1] == "diep"){
            game = 'https://diep.io/'
          } else if (args[1] == "krunker"){
            game = "https://krunker.io/"
          }

          message.channel.send("Here's the link for " + args[1] + ": " + game);


        }

        break;

    case 'accent':

        var languages = ['french', 'german', 'russian', 'japanese', 'chinese', 'english', 'arabic', 'italian', 'spanish', 'korean', 'portuguese', 'swedish', 'dutch', 'nz', 'aussie', 'quebec', 'indian', 'american', 'welsh'];

            if (!args[1]){
            message.channel.send('error (put something nicer here)');
            break;
        }

            var lang;
            var ms = args.slice(2, args.length).toString().replace(/,/gi, '+');

        if (args[1] == languages[0]){
            lang = 'fr';
        } else if (args[1] == languages[1]){
            lang = 'de';
        } else if (args[1] == languages[2]){
            lang = 'ru';
        } else if (args[1] == languages[3]){
            lang = 'ja';
        } else if (args[1] == languages[4]){
            lang = 'zh';
        } else if (args[1] == languages[5]){
            lang = 'en';
        } else if (args[1] == languages[6]){
            lang = 'ar';
        } else if (args[1] == languages[7]){
            lang = 'it';
        } else if (args[1] == languages[8]){
            lang = 'es';
        } else if (args[1] == languages[9]){
            lang = 'ko';
        } else if (args[1] == languages[10]) {
            lang = 'pt';
        } else if (args[1] == languages[11]) {
            lang = 'sw';
        } else if (args[1] == languages[12]) {
            lang = 'nl';
        } else if (args[1] == languages[13]) {
            lang = 'en_nz';
        } else if (args[1] == languages[14]) {
            lang = 'en_au';
        } else if (args[1] == languages[15]) {
            lang = 'fr_ca';
        } else if (args[1] == languages[16]) {
            lang = 'hi';
        } else if (args[1] == languages[17]) {
            lang = 'en_us';
        } else if (args[1] == languages[18]) {
            lang = 'cy';
        } else {
            message.channel.send("That's not a language fucktard");
            lang = 'es';
            ms = 'thats+not+a+language+fucktard';
        }

        if (message.member.voice.channel) {
            console.log('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + lang + '&q=' + ms);
            const connection = await message.member.voice.channel.join();
            const dispatcher = connection.play('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + lang + '&q=' + ms);
        } else {
            message.reply('You need to join a voice channel first!');
        }
        break;

    case 'hangman':

        words = ["bomboclaat"];
        alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

        hidden_word = "";

        for (var i = 0; i < words[0].length; i++) {
            hidden_word += "_ ";
        }

        if (args[1] == "play"){
            message.channel.send(hidden_word);
        } else if (alphabet.includes(args[1])){
            if (words[0].includes(args[1])){

                message.channel.send(hidden_word);
            } else {
                message.channel.send("unlucky");
            }
        }
        break;


    default:
        help();
        break;

    }
})

// uses no prefix

bot.on('message', async msg  => {

    if (msg.content === 'fuck you hugo'){
        msg.reply('Yeah I agree!');
    } else if (msg.content == 'show me your beautiful self'){
        msg.channel.send({files : ['https://i.kym-cdn.com/entries/icons/facebook/000/030/873/screenshot_20.jpg' ]})
    }

    var lang;

    if (!msg.content.startsWith(PREFIX) && msg.author.username != 'Bomboclaat Bot') {
        switch (msg.author.username){
            case 'Jesus du 89':
                lang = 'de';
                break;
            case 'Diegovo':
                lang = 'es';
                break;
            case 'Bobnotarobot':
                lang = 'ru';
                break;
            case 'miam-miam':
                lang = 'en_gb';
                break;
            case 'Terminator00702':
                lang = 'fr';
                break;
            case 'Clovis':
                lang = 'fr_ca';
                break;
            case 'Lottie':
                lang = 'fr_ca';
                break;
        }
        const connection = await msg.member.voice.channel.join();
        const dispatcher = connection.play('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + lang + '&q=' + msg.content.slice(0, msg.content.length).toString().replace(/ /gi, '+'));
    }
})

bot.login(token);
