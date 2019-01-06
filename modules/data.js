//Load Enmap and the base
const Enmap = require('enmap');
const guildID = require('../token.json').guildID;

const mainStorage = new Enmap(`mainStorage_{guildID}`);

//Import Request
const request = require('./request.js');

function setPlayer(wgID, discordID){
    return new Promise(function(resolve,reject) {
        if(mainStorage.has(discordID)){
            reject('This player have been registered')
        }
        if(mainStorage.exists('wgID',wgID)){
            reject('This Wargaming ID is already registered by another Discord user')
        }

        //if this player has never been registered



    });
}

function hasPlayer(discordID){
    return mainStorage.has(discordID);
}


exports.hasPlayer = hasPlayer;
exports.setPlayer = setPlayer;