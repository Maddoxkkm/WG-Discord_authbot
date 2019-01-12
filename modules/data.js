//Load Enmap and the base
const Enmap = require('enmap');
const guildID = require('../token.json').guildID;

const mainStorage = new Enmap(`mainStorage`);

//Import Request
const request = require('./request.js');

//Import players requests
const players = require('./players.js');

const serverShortNametoRegion = require('../main.js').serverShortNametoRegion;

function setPlayer(wgID, realm, discordID){
    return new Promise(async function(resolve,reject) {
        try{
            if(mainStorage.has(discordID)){
                reject('This Discord User have been verified')
            }
            if(mainStorage.exists('wgID',wgID)){
                reject('This Wargaming ID is already registered by another Discord user')
            }

            //if this player has never been registered (or has his record deleted)
            //grab his statistics and also clan details
            const playerStats = await players.playerStats(realm,wgID);
            const playerClan = await players.playerClan(realm, wgID);

            if(playerStats === null) reject("this player doesn't have any battle records");
            const playerObj = {
                wgID: wgID,
                lastUpdated: new Date().getTime(),
                region: realm.shortServerName,
                player: playerStats,
                clan: playerClan,
                periodicCheck: { //default values for periodic check and notification
                    check: false,
                    notify: false
                }
            };
            mainStorage.set(discordID,playerObj);
            resolve(true)
        } catch (e) {
            reject (e)
        }


    });
}

function hasPlayer(discordID){
    return mainStorage.has(discordID);
}

async function updateProfile(discordID){
    try {
        //As this triggered whenever a registered player sends a message, you want to make sure their last update is sometime ago (like 12 hours ago)

        const profile = mainStorage.get(discordID);
        const period = 43200000;
        const now = new Date().getTime();

        if(profile.lastUpdated + period < now){
            const realm = serverShortNametoRegion(profile.region);
            const wgID = profile.wgID;

            //Obtain new player's stats
            const newPlayerStats = await players.playerStats(realm,wgID);
            const newPlayerClan = await players.playerClan(realm, wgID);
            mainStorage.setProp(discordID, "player", newPlayerStats);
            mainStorage.setProp(discordID, "clan", newPlayerClan);
            mainStorage.setProp(discordID, "lastUpdated", new Date().getTime())
        }
    } catch (e) {
        //Ignore the error since when the user sends another message this function will be ran again
    }

}

exports.updateProfile = updateProfile;
exports.hasPlayer = hasPlayer;
exports.setPlayer = setPlayer;
exports.mainStorage = mainStorage;