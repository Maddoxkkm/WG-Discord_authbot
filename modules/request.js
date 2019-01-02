const request = require('request');

//require SerBot Details
const errors = require('./errors.js');

/**
 * request (copied from https://stackoverflow.com/questions/38428027/why-await-is-not-working-for-node-request-module)
 * @param {String} url
 * @return {Promise<String>} Returned Body
 * @constructor
 */
function Request(url){
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            //console.log('error:', error);
            //console.log('statusCode:', response && response.statusCode);
            //console.log('body:', body);
            if (!error && res.statusCode === 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}


/**
 *
 * @param {object} data Data from WarGaming API
 * @return {Promise<boolean>} Returns True if it's a valid API response, otherwise will return the entire API response.
 */
function apiValidation(data){
    return new Promise(function(resolve, reject){
        if(data.status === 'ok'){
            resolve(true)
        } else {
            let response = {
                response: data,
                error: errors.WG_api_Error
            };
            reject(response)

        }
    })
}


async function wgApiCall(url){
    return new Promise(async function(resolve, reject){
        const apiTries = 3; //at most request x times
        let response;
        for (let x = 0; x < apiTries; x++){
            response = JSON.parse(await Request(url));
            try{
                await apiValidation(response);
                resolve(response)
            }
            catch(error){
                if(x === apiTries - 1){
                    reject(error)
                } else {
                    console.log(`Retrying WG API call due to API returned Error Array`)
                }
            }
        }
        reject(response)
    })
}

exports.Request = Request;
exports.wgApiCall = wgApiCall;