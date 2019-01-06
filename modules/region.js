/**
 * @readonly
 * @enum {Region}
 */
const region = {
    NA:{
        serverName: "North America Server",
        apiDomain: "http://api.wotblitz.com",
        shortServerName: "NA",
        portalPage: "http://wotblitz.com",
        mainLanguage: "en",
        toplevelDomain: "com"
    },
    ASIA:{
        serverName: "Asia Server",
        apiDomain: "http://api.wotblitz.asia",
        shortServerName: "ASIA",
        portalPage: "http://wotblitz.asia",
        mainLanguage: "en",
        toplevelDomain: "asia"
    },
    EU:{
        serverName: "European Server",
        apiDomain: "http://api.wotblitz.eu",
        shortServerName: "EU",
        portalPage: "http://wotblitz.eu",
        mainLanguage: "en",
        toplevelDomain: "eu"
    },
    RU:{
        serverName: "Russian Server",
        apiDomain: "http://api.wotblitz.ru",
        shortServerName: "RU",
        portalPage: "http://wotblitz.ru",
        mainLanguage: "ru",
        toplevelDomain: "ru"
    }
};

//prevents modification to object
module.exports = Object.freeze(region);