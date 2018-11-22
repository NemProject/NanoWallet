/** @module utils/helpers */

import nem from 'nem-sdk';
import Exchanges from './exchanges';

/**
 * Check if wallet already present in an array
 *
 * @param {string} walletName - A wallet name
 * @param {array} array - A wallets array
 *
 * @return {boolean} - True if present, false otherwise
 */
let haveWallet = function(walletName, array) {
    let i = null;
    for (i = 0; array.length > i; i++) {
        if (array[i].name === walletName) {
            return true;
        }
    }
    return false;
}

/**
 * Remove extension of a file name
 *
 * @param {string} filename - A file name with extension
 *
 * @return {string} - The file name without extension
 */
let getFileName = function(filename) {
    return filename.replace(/\.[^/.]+$/, "");
};

/**
 * Gets extension of a file name
 *
 * @param {string} filename - A file name with extension
 *
 * @return {string} - The file name extension
 */
let getExtension = function(filename) {
    return filename.split('.').pop();
}

/**
 * Calculate a number of pages
 *
 * @param {array} array - An array data
 * @param {number} pageSize - The number of elements per page
 *
 * @return {number} - A number of pages
 */
let calcNumberOfPages = function(array, pageSize) {
    if(!array || ! pageSize) return 0;
    return Math.ceil(array.length / pageSize);
}

/**
 * Fix a value to 4 decimals
 */
let toFixed4 = function(value) {
    return value.toFixed(4);
}

/**
 * Clean quantities in an array of mosaicAttachment objects 
 * 
 * @param {array} elem - An array of mosaicAttachment objects or a single object
 * @param {object} mosaicDefinitions - An object of mosaicDefinitions objects
 * 
 * @return {array} copy - A cleaned array of mosaicAttachment objects 
 */
let cleanMosaicAmounts = function(elem, mosaicDefinitions) {
    // Deep copy: https://stackoverflow.com/a/5344074
    let copy;
    if(Object.prototype.toString.call(elem) === '[object Array]') {
        copy = JSON.parse(JSON.stringify(elem));
    } else {
        let _copy = [];
        _copy.push(JSON.parse(JSON.stringify(elem)))
        copy = _copy;
    }
    for (let i = 0; i < copy.length; i++) {
        // Check text amount validity
        if(!nem.utils.helpers.isTextAmountValid(copy[i].quantity)) {
            return [];
        } else {
            let divisibility = mosaicDefinitions[nem.utils.format.mosaicIdToName(copy[i].mosaicId)].mosaicDefinition.properties[0].value;
            // Get quantity from inputed amount
            copy[i].quantity = Math.round(nem.utils.helpers.cleanTextAmount(copy[i].quantity) * Math.pow(10, divisibility));
        }
    }
    return copy;
}

/**
 * Check validity of namespace name
 *
 * @param {string} ns - A namespace name
 * @param {boolean} isParent - True if parent namespace, false otherwise
 */
let namespaceIsValid = function(ns, isParent) {
    // Test if correct length and if name starts with hyphens
    if (!isParent ? ns.length > 16 : ns.length > 64 || /^([_-])/.test(ns)) {
        return false;
    }
    let pattern = /^[a-z0-9.\-_]*$/;
    // Test if has special chars or space excluding hyphens
    if (pattern.test(ns) == false) {
        return false;
    } else {
        return true;
    }
}

/**
 * Test if a string is hexadecimal
 *
 * @param {string} str - A string to test
 *
 * @return {boolean} - True if correct, false otherwise
 */
let isHexadecimal = nem.utils.helpers.isHexadecimal;

/**
 * Check if a text input amount is valid
 *
 * @param {string} n - The number as a string
 *
 * @return {boolean} - True if valid, false otherwise
 */
let isTextAmountValid = nem.utils.helpers.isTextAmountValid;

/**
 * Verify if a message is set when sending to an exchange
 *
 * @param {object} entity - A prepared transaction object
 *
 * @return {boolean} - True if valid, false otherwise
 */
let isValidForExchanges = function(entity) {
    const exchanges = Exchanges.data;
    let tx = entity.type === nem.model.transactionTypes.multisigTransaction ? entity.otherTrans : entity;
    for (let i = 0; i < exchanges.length; i++) {
        let isExchange = exchanges[i].address === tx.recipient;
        let hasMessage = tx.message.payload.length > 0;
        let isPlain = tx.message.type === 1;
        // Deposits to exchanges must have a plain message
        if ((isExchange && !hasMessage) || (isExchange && hasMessage && !isPlain)) return false;
    }
    return true;
}

/**
 * Return the size of an object of objects
 *
 * @param {object} obj - An object of objects
 *
 * @return {number} - The object size
 */
let objectSize = function(obj) {
    if (!obj) return;
    return Object.keys(obj).length;
}

/**
 * Date object to YYYY-MM-DD format
 *
 * @param {object} date - A date object
 *
 * @return {string} - A short date
 */
let toShortDate = function(date) {
    let dd = date.getDate();
    let mm = date.getMonth() + 1; //January is 0!
    let yyyy = date.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    return yyyy + '-' + mm + '-' + dd;
};

/**
 * index 1 - ([0-9]+\.[0-9]+\.[0-9]+) - mandatory - 3 numbers separated by dots - major.minor.patch
 * index 3 - (-([a-zA-Z0-9\.]+))? - optional - minus and alphanumeric prerelease info separated by dots
 * index 5 - (\+([a-zA-Z0-9]+))? - optional - plus and alphanumeric metadata
 * index 7 - (\s+(.*))? - optional - space and any text
 * 
 * metadata and text do not influence precedence
 */
const VERSION_PATTERN = /([0-9]+\.[0-9]+\.[0-9]+)(-([a-zA-Z0-9\.]+))?(\+([a-zA-Z0-9]+))?(\s+(.*))?/;
/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2.3-alpha.3+meta comment").
 *
 * From http://stackoverflow.com/a/6832721 but heavily adjusted to support semver2
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 */
let versionCompare = function(v1, v2) {
    var v1match = VERSION_PATTERN.exec(v1);
    var v2match = VERSION_PATTERN.exec(v2);

    /** return an array with version */
    function getVersion(v) {
        return v.split('.').map(Number);
    }

    // compare the version information
    var v1version = getVersion(v1match[1]);
    var v2version = getVersion(v2match[1]);
    // iterate over major, minor and patch
    for (var i = 0; i < 3; ++i) {
        if (v1version[i] > v2version[i]) {
            return 1;
        } else if (v1version[i] < v2version[i]){
            return -1;
        }
    }
    // version was the same so let's see the pre-release info
    var v1isPrerelease = typeof v1match[2] !== 'undefined';
    var v2isPrerelease = typeof v2match[2] !== 'undefined';
    if (v1isPrerelease > v2isPrerelease) {
        return -1;
    } else if (v1isPrerelease < v2isPrerelease) {
        return 1;
    }
    // try comparing prerelease info if applicable
    if (v1isPrerelease && v2isPrerelease) {
        // TODO iterate over the prerelease info and decide
        return NaN;
    }
    // still not decided so that means equal
    return 0;
}


/**
 * Fix "FAILURE_TIMESTAMP_TOO_FAR_IN_FUTURE"
 *
 * @param {object} transaction - A prepared transaction to fix
 * @param {number} chainTime - Time returned by the NIS node
 * @param {number} network - A network
 */
let fixTimestamp = function(transaction, chainTime, network) {
    let d = new Date();
    let timeStamp = Math.floor(chainTime) + Math.floor(d.getSeconds() / 10);
    let due = network === nem.model.network.data.testnet.id ? 60 : 24 * 60;
    let deadline = timeStamp + due * 60
    if (transaction.type === nem.model.transactionTypes.multisigTransaction) {
        transaction.otherTrans.timeStamp = timeStamp;
        transaction.otherTrans.deadline = deadline;
    } else {
        transaction.timeStamp = timeStamp;
        transaction.deadline = deadline;
    }
    return transaction;
}

module.exports = {
    haveWallet,
    getFileName,
    getExtension,
    calcNumberOfPages,
    toFixed4,
    cleanMosaicAmounts,
    namespaceIsValid,
    isHexadecimal,
    isTextAmountValid,
    isValidForExchanges,
    objectSize,
    toShortDate,
    versionCompare,
    fixTimestamp
}