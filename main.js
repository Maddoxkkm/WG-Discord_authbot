//load Bot tokens
const tokens = require('./token.json');
const discordToken = tokens.discordToken;
const wgapiToken = tokens.wgapiToken;
const targetGuild = tokens.guildID;

//manually set prefix and command invoke
const prefix = 'wg!';
const commandInvoke = '-';

//Discord
const Discord = require("discord.js");
const authBot = new Discord.Client({
    messageCacheLifetime: 60,
    messageSweepInterval: 400,
    messageCacheMaxSize: 10,
    disabledEvents: ["TYPING_START"]
});

//Region and related stuff
const region = require('./modules/region.js');

//Enmap Interface
const playerDB = require('./modules/data.js');

/**
 * A Function that converts ms to a String that indicates lengh ot time
 * @param {number} ms
 * @return {string}
 * @constructor
 */
function convertMS(ms){
    let timeArray = [];
    let temp = Math.floor(ms / 1000);
    let sec = temp % 60;
    temp = Math.floor(temp / 60);
    let min = temp % 60;
    temp = Math.floor(temp / 60);
    let hrs = temp % 24;
    temp = Math.floor(temp / 24);
    let days = temp;

    if(days !== 0){
        if(days === 1){
            timeArray.push("1 Day")
        } else {
            timeArray.push(`${days} Days`)
        }
    }

    if(hrs !== 0){
        if(hrs === 1){
            timeArray.push("1 Hour")
        } else {
            timeArray.push(`${hrs} Hours`)
        }
    }

    if(min !== 0){
        if(min === 1){
            timeArray.push("1 Minute")
        } else {
            timeArray.push(`${min} Minutes`)
        }
    }

    if(sec !== 0){
        if(days === 1){
            timeArray.push("1 Second")
        } else {
            timeArray.push(`${sec} Seconds`)
        }
    }
    return timeArray.join(", ");
}


authBot.on('ready', function(){
    //verify whether the bot is in the guild or not
    const guild = authBot.guilds.get(targetGuild);
    if(!authBot.guilds.has(targetGuild)) {
        console.log('The Bot will be idle until it has joined the target guild');
    } else {

        console.log(`bot is ready to serve in "${guild.name}" with ${guild.memberCount} members`)
    }
});

//log any error
authBot.on('error', err => console.log(`ERROR: ${err}`));

//When a new member joins the observing server
authBot.on('guildMemberAdd', guildMember => {
    //ignore any member join that is not part of the guild && has already verified
    if (guildMember.guildID === targetGuild && playerDB.hasPlayer(guildMember.id)) {
        sendVerification(guildMember.user)
    }
});

/**
 *
 * @param {User} user
 */
function sendVerification(user){
    const guild = authBot.guilds.get(targetGuild);
    user.send('',{
        embed: {
            color: 3097087,
            author: {
                name: authBot.user.username,
                icon_url: authBot.user.avatarURL
            },
            title: `${authBot.user.username}'s Vericifation Module`,
            description: `Verify your Wargaming Identity in order to enjoy the full member privilage of **${guild.name}**!\nPlease click on one of the following links corresponding to the server you play on, and login using your credentials! This bot has no access to any info about your account except your In-Game Name and Wargaming Player ID`,
            fields: [
                {
                    'name':'',
                    'value':''
                }
            ]
        }
    })
}

authBot.login(discordToken)
    .then(console.log('login successful'))
    .catch(err => console.log(err));