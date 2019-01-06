//Load Enmap and the base
const Enmap = require('enmap');
const guildID = require('../token.json').guildID;

const mainStorage = new Enmap(`mainStorage`);

//Import Request
const request = require('./request.js');

//Import players requests
const players = require('./players.js');

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
            console.log(playerStats);
            console.log(playerClan);
            const playerObj = {
                wgID: wgID,
                lastUpdated: new Date().getTime(),
                ign: playerStats.nickname,
                region: realm.shortServerName,
                playerStats: playerStats,
                clan: playerClan,
                periodicCheck: { //default values for periodic check and notification
                    check: false,
                    notify: false
                }
            };

            console.log(playerObj);

            mainStorage.set(discordID,playerObj);

            resolve()
        } catch (e) {
            reject (e)
        }


    });
}

function hasPlayer(discordID){
    return mainStorage.has(discordID);
}

exports.hasPlayer = hasPlayer;
exports.setPlayer = setPlayer;
exports.mainStorage = mainStorage;