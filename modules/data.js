//Load Enmap and the base
const Enmap = require('enmap');

const mainStorage = new Enmap('mainStorage');

function setPlayer(wgID, discordID){
    return new Promise(function(resolve,reject) {
        if(mainStorage.has(discordID)){
            reject('registered')
        }
        if(mainStorage.exists('wgID',wgID)){
            reject('existWGID')
        }

        //if this player has never been registered
        

    });
}