//load Bot tokens
const tokens = require('./token.json');
const discordToken = tokens.discordToken;
const wgapiToken = tokens.wgapiToken;
const targetGuild = tokens.guildID;
const serverport = tokens.serverport;

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

//Import webservice
const http = require('http');
const url = require('url');

//import homemade requests :3
const request = require('./modules/request.js');

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

    if(days > 0){
        if(days === 1){
            timeArray.push("1 Day")
        } else {
            timeArray.push(`${days} Days`)
        }
    }

    if(hrs > 0){
        if(hrs === 1){
            timeArray.push("1 Hour")
        } else {
            timeArray.push(`${hrs} Hours`)
        }
    }

    if(min > 0){
        if(min === 1){
            timeArray.push("1 Minute")
        } else {
            timeArray.push(`${min} Minutes`)
        }
    }

    if(sec > 0){
        if(days === 1){
            timeArray.push("1 Second")
        } else {
            timeArray.push(`${sec} Seconds`)
        }
    }
    return timeArray.join(", ");
}

function serverShortNametoRegion(serverShortName){
    switch(serverShortName){
        case region.NA.shortServerName:
            return region.NA;
        case region.EU.shortServerName:
            return region.EU;
        case region.ASIA.shortServerName:
            return region.ASIA;
        case region.RU.shortServerName:
            return region.RU;
        default:
            throw "Invalid Region";
    }
}

const commands = [
    {
        name: "Identity Verification command",
        command: "verify",
        usage: `${prefix}${this.command}`,
        description: "Used to link your Wargaming to your Discord account.",
        do: function(message, args){
            sendVerification(message.member)
        },
        permission: function(guildUser){
            return !playerDB.hasPlayer(guildUser.id);
        }
    },
    {
        name: "Bot Off",
        command: "off",
        usage: `${prefix}${this.command}`,
        description: "Bot Admin Use only. Restarts Bot",
        do: function(message, args){
            //clean persistance for testing phase, remove after bot goes live.
            playerDB.mainStorage.deleteAll();
            process.exit(0);
        },
        permission: function(guildUser){
            return guildUser.id === "124146729187672064" || guildUser.id === "76584929063866368"
        }
    },
    {
        name: "Who-Is Command",
        command: "whois",
        usage: `${prefix}${this.command} [Mentions]`,
        description: "This command is used to obtain a registered player's identity, also the player's cached stats.",
        do: function(message, args){
            whois(message)
        },
        permission: function(guildUser){
            return playerDB.hasPlayer(guildUser.id);
        }
    },
    {
        name: "Unlink Command",
        command: "unlink",
        usage: `${prefix}${this.command}`,
        description: "This command is used to unlink a player's identity",
        do: function(message, args){
            playerDB.mainStorage.delete(message.author.id)
        },
        permission: function(guildUser){
            return playerDB.hasPlayer(guildUser.id);
        }
    }
];

const roles = [

];

 function personalRating(battles,winrate,survivalrate,hitrate,avgdmg){
    let random1 = 2 / (1 + Math.exp(-(battles) / 3000)) - 1;
    let random2 = 3000 / (1 + Math.exp(13 - 25 * winrate));
    let random3 = 1300 / (1 + Math.exp(7 - 22 * survivalrate));
    let random4 = 700 / (1 + Math.exp(14 - 24 * hitrate));
    let random5 = random2 + random3 + random4 + avgdmg;
    return (random1 * random5);
};

authBot.on('ready', function(){
    //verify whether the bot is in the guild or not
        const guild = authBot.guilds.get(targetGuild);
    if(!authBot.guilds.has(targetGuild)) {
        console.log('The Bot will be idle until it has joined the target guild');
    } else {

        console.log(`bot is ready to serve in "${guild.name}" with ${guild.memberCount} members`)
    }
    guild.roles.map(function(value,key,collection){
        console.log(`${key}, ${value.name}`)
    });

    http.createServer(async function (req, res) {
        try {
            //Return the url part of the request object:
            const parsed = url.parse(req.url, true);
            const uriArray = parsed.pathname.split('/').filter(x => x !== '');
            if(uriArray.length === 3 && uriArray[0] === "regPlayer"){
                // known the uri is for regPlayer, we can continue to check the region,
                const realm = serverShortNametoRegion(uriArray[1]);

                //got the region, next is to grab the Discord ID, and record everything about it
                const discordID = uriArray[2].toString();
                //See if the user is accessible
                const targetUser = authBot.users.get(discordID);
                if(targetUser === undefined) throw "Invalid Discord User";
                if(parsed.query.status === "error") throw JSON.stringify(parsed.query);

                //now we've got everything, time to grab the access token (and verify it), not the player ID directly (because the call can be made up and checking validity of token is more secure)
                const newToken = JSON.parse(await request.Post({url:`https://api.worldoftanks.${realm.toplevelDomain}/wot/auth/prolongate/`, form:{access_token: parsed.query.access_token, application_id: wgapiToken}}));
                if(newToken.status === "error") throw JSON.stringify(newToken);

                //Only if the token is confirmed valid (not made up), we then proceed to add the player to the record
                await playerDB.setPlayer(newToken.data.account_id, realm,discordID);

                targetUser.send('',{
                    embed: {
                        color: 3097087,
                        author: {
                            name: authBot.user.username,
                            icon_url: authBot.user.avatarURL
                        },
                        title: `${authBot.user.username}'s Vericifation Module`,
                        description: `You have successfully verified your Wargaming Identity, ${playerDB.mainStorage.getProp(discordID,'player.nickname')}!`,
                    }});
                const guildUser = guild.members.get(discordID);
                ignSet(guildUser);
                grantRoles(guildUser);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(`You have successfully verified your identity, ${authBot.user.username} will send you a PM to confirm!`);
            } else {
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.write("ERROR 404 NOT FOUND");
            }
            res.end();
        } catch (e) {
            console.log(e);
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.write(`ERROR 404 NOT FOUND\<\p\> REASON: ${e}`);
            res.end();
        }}).listen(serverport);
});

//log any error
authBot.on('error', error => console.log(`ERROR: ${error}`));

//When a new member joins the observing server
authBot.on('guildMemberAdd', guildMember => {
    //ignore any member join that is not part of the guild && has already verified
    console.log("hwat?");
    if (guildMember.guild.id === targetGuild && !playerDB.hasPlayer(guildMember.id)) {
        sendVerification(guildMember)
    } else if (guildMember.guild.id === targetGuild && playerDB.hasPlayer(guildMember.id)){
        ignSet(guildMember);
        grantRoles(guildMember);
    }
});

async function ignSet(guildMember){
    try{
        //if the bot can't do anything to the member then forget about it.
        if(guildMember.manageable){
            const memberid = guildMember.id;
            const reasonString = `${authBot.user.username}'s NickName Update Service`;
            if(!playerDB.hasPlayer(memberid)) throw "Player does not exist?";
            const memberData = playerDB.mainStorage.get(memberid);

            const ign = memberData.player.nickname;
            const clanData = memberData.clan;
            const server = memberData.region;
            if(clanData === null){
                await guildMember.setNickname(`${ign} (${server})`, reasonString);
            } else {
                await guildMember.setNickname(`${ign} [${clanData.clan.tag}] (${server})`, reasonString)
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function grantRoles(guildMember){
    //feel free to edit this to grant whatever roles you like
    try {
        const memberid = guildMember.id;
        const reasonString = `${authBot.user.username}'s Role Update Service`;
        if(playerDB.hasPlayer(memberid)){
            await guildMember.addRole('529865664941391872', reasonString);
            const playerStats = playerDB.mainStorage.getProp(memberid, "player");
            const wr = playerStats.statistics.all.wins/playerStats.statistics.all.battles;
            const battles = playerStats.statistics.all.battles;
            if(wr>=0.6 && battles>=15000){
                await guildMember.addRole('529865726492934155', reasonString);
            }
        }
    } catch (e) {
        console.log(e);
    }

}

function sendVerification(guildMember){
    const guild = authBot.guilds.get(targetGuild);
    guildMember.send('',{
        embed: {
            color: 3097087,
            author: {name: authBot.user.username, icon_url: authBot.user.avatarURL},
            title: `${authBot.user.username}'s Vericifation Module`,
            description: `Verify your Wargaming Identity in order to enjoy the full member privilage of **${guild.name}**!\nPlease click on one of the following links corresponding to the server you play on, and login using your credentials! This bot has no access to any info about your account details, as you will be logging in via Wargaming's portals.\n\nAlso, Do **NOT** share this link to anyone else, as they will be able to link their Wargaming account to your Discord ID, which is irreversible!\n\nBy Signing in and verifying your identity, you agree to obey the rules and regulations of **${guild.name}**.`,
            fields: [
                {'name':`${region.NA.serverName}`, 'value':`[Click Here](https://api.worldoftanks.com/wot/auth/login/?application_id=${wgapiToken}&redirect_uri=http://${tokens.serverDomainPort}/regPlayer/${region.NA.shortServerName}/${guildMember.id}/)`},
                {'name':`${region.EU.serverName}`, 'value':`[Click Here](https://api.worldoftanks.eu/wot/auth/login/?application_id=${wgapiToken}&redirect_uri=http://${tokens.serverDomainPort}/regPlayer/${region.EU.shortServerName}/${guildMember.id}/)`},
                {'name':`${region.ASIA.serverName}`, 'value':`[Click Here](https://api.worldoftanks.asia/wot/auth/login/?application_id=${wgapiToken}&redirect_uri=http://${tokens.serverDomainPort}/regPlayer/${region.ASIA.shortServerName}/${guildMember.id}/)`},
                {'name':`${region.RU.serverName}`, 'value':`[Click Here](https://api.worldoftanks.ru/wot/auth/login/?application_id=${wgapiToken}&redirect_uri=http://${tokens.serverDomainPort}/regPlayer/${region.RU.shortServerName}/${guildMember.id}/)`}
            ]
        }
    }).catch(() => {
        turnOnPMNotify(guildMember)
    })
}

function turnOnPMNotify(guildMember){
    guildMember.guild.systemChannel.send(`<@${guildMember.id}>`,{
        embed: {
            color: 16711680,
            author: {name: authBot.user.username, icon_url: authBot.user.avatarURL},
            title: `${authBot.user.username} is unable to send you DM message!`,
            description: `<@${guildMember.id}>, please turn on "Allow direct messages from server members" option to enjoy the full privilage of ${authBot.user.username}'s full functionality!`
        }
    })
}

function whois(message){
    message.mentions.members.map(function(guildMember, id, collection){
        if(playerDB.hasPlayer(id)){
            const now = (new Date().getTime() / 86400000);
            const cachedProfile = playerDB.mainStorage.get(id);
            const rawStats = cachedProfile.player.statistics.all;
            const wr = ((rawStats.wins / rawStats.battles) * 100);
            let wrcolor;
            switch (true){
                case wr >= 70: wrcolor = 4198512; break;
                case wr >= 60 && wr < 70: wrcolor = 3764934; break;
                case wr >= 50 && wr < 60: wrcolor = 5075750; break;
                default: wrcolor = 16777215; break;
            }

            const avgDmg = rawStats.damage_dealt / rawStats.battles;
            const survivalRate = rawStats.survived_battles / rawStats.battles;
            const hitRate = rawStats.hits / rawStats.shots;
            const dmgRatio = rawStats.damage_dealt / rawStats.damage_received;

            const pRating = personalRating(rawStats.battles,wr/100,survivalRate,hitRate,avgDmg);

            let replyBlock;
            if(cachedProfile.clan === null){
                replyBlock =    `Name      : ${cachedProfile.player.nickname} From ${serverShortNametoRegion(cachedProfile.region).serverName}\n\nDate Of Account Creation: ${new Date(cachedProfile.player.created_at * 1000).toLocaleDateString()}`
            } else {
                let clanRole;
                switch(cachedProfile.clan.role){
                    case "commander": clanRole = "Commander"; break;
                    case "private": clanRole = "Private"; break;
                    case "executive_officer": clanRole = "Executive Officer"; break;
                }
                replyBlock =    `Name      : ${cachedProfile.player.nickname} [${cachedProfile.clan.clan.tag}] From ${serverShortNametoRegion(cachedProfile.region).serverName}\nClan      : ${cachedProfile.clan.clan.name} (Joined ${(now - new Date(cachedProfile.clan.joined_at/86400)).toFixed(0)} Days Ago)\nPosition  : ${clanRole}\n\nDate Of Account Creation: ${new Date(cachedProfile.player.created_at * 1000).toLocaleDateString()}`

            }

            message.channel.send(`\`\`\`\n${authBot.user.username}'s Who-Is Player Look-up System \n===========================\n${replyBlock}\n===========================\nNote: If you don't see the embeded message with extra data below this line, please Enable >Embed Links< Permission For ${authBot.user.username}!\`\`\``,{
                embed: {
                    color: wrcolor,
                    author: {name: authBot.user.username, icon_url: authBot.user.avatarURL},
                    title: `Player's Basic Statistic Overview`,
                    description: `Below are the basic statistic of <@${id}>, but actual statistics may differ as ${authBot.user.username} uses a cached version of player's data.`,
                    fields: [
                        {name: 'WG Personal Rating', value: `**${pRating.toFixed(0)}**`},
                        {name: 'Battles', value: `**${rawStats.battles}**`, inline: true},
                        {name: 'Winrate', value: `**${wr.toFixed(2)}%**`, inline: true},
                        {name: 'Average Damage', value: `**${avgDmg.toFixed(1)}**`, inline: true},
                        {name: 'Damage Ratio', value: `**${dmgRatio.toFixed(3)}**`, inline: true},
                        {name: 'Hit Ratio', value: `**${(hitRate * 100).toFixed(2)}%**`, inline: true},
                        {name: 'Survival Ratio', value: `**${(survivalRate * 100).toFixed(2)}%**`, inline: true},
                    ],
                    footer: {icon_url: authBot.user.avatarURL, text: 'Definitely not a copy of SerBot'}}
            })
        } else {
            message.channel.send(``,{
                embed: {
                    color: 16711680,
                    author: {name: authBot.user.username, icon_url: authBot.user.avatarURL},
                    title: `this player has not been registered on ${authBot.user.username}'s System!`,
                    description: `As <@${guildMember.id}> have not verified his identity, I do not know his in-game identity. please verify identity before using this command!`
                }
            })
        }
    })
}
//react to messages
authBot.on('message', message => {
    // Update their data when they send messages
    if(playerDB.hasPlayer(message.author.id)){
        playerDB.updateProfile(message.author.id)
    }

    if(!message.content.toLowerCase().startsWith(prefix) || message.guild === null) return;
    const args = message.content.split(' ');

    const finalCommand = commands
        .filter(cmd => cmd.permission(message.member))
        .reduce(function(acc, cur){
            if (args[0].toUpperCase() === prefix.toUpperCase() + cur.command.toUpperCase()){
                return cur;
            } else {
                return acc;
            }}
            ,undefined);

    if(finalCommand !== undefined) finalCommand.do(message, args);
    else {console.log("didn't catch?")}
});

authBot.login(discordToken)
    .then(console.log('login successful'))
    .catch(err => console.log(err));


exports.serverShortNametoRegion = serverShortNametoRegion;