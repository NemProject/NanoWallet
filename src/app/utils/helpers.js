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
 * index 3 - (-([0-9A-Za-z-\.]+))? - optional - minus and [0-9A-Za-z-] prerelease info separated by dots
 * index 5 - (\+([0-9A-Za-z-\.]+))? - optional - plus and [0-9A-Za-z-] metadata separated by dots
 * index 7 - (\s+(.*))? - optional - space and any text
 * 
 * metadata and text do not influence precedence
 */
const VERSION_PATTERN = /([0-9]+\.[0-9]+\.[0-9]+)(-([0-9A-Za-z-\.]+))?(\+([0-9A-Za-z-\.]+))?(\s+(.*))?/;
/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2.3-alpha.3+meta comment").
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 */
let versionCompare = function(v1, v2) {
    var v1match = VERSION_PATTERN.exec(v1);
    var v2match = VERSION_PATTERN.exec(v2);

    /** return an array with version fields or empty array */
    function split(v) {
        if (typeof v == 'undefined') {
            return [];
        } else {
            return v.split('.');
        }
    }
    /** try to convert value to number */
    function compare(v1, v2) {
        if (isNaN(v1) && isNaN(v2)) {
            // neither is number so compare alphabetically
            return v1.localeCompare(v2);
        } else if (!isNaN(v1) && !isNaN(v2)) {
            // both are numbers so compare numerically
            return Number(v1) - Number(v2);
        } else if (isNaN(v1)) {
            // first is string and second number - number is smaller per semver
            return 1;
        } else {
            // first is number and second is string - number is smaller per semver
            return -1;
        }
    }
    /** compare 2 arrays per semver spec */
    function compareArrays(a1, a2) {
        // go item by item and report first difference
        for (var i=0; i<a1.length; i++) {
            // if there is no such item in second array then the first shorter is bigger
            if (a2.length <= i || typeof a2[i] == 'undefined') {
                return 1;
            }
            // compare the 2
            var result;
            if (result = compare(a1[i], a2[i])) {
                return result;
            }
        }
        // if a1 is shorter then it is bigger
        if (a1.length < a2.length) {
            return -1;
        }
        // failed to find difference so report equality
        return 0;
    }

    var result;
    // compare the version information numerically
    if (result = compareArrays(split(v1match[1]), split(v2match[1]))) {
        return result;
    }
    // version was the same so let's see the pre-release info
    var preInfo1 = split(v1match[3]);
    var preInfo2 = split(v2match[3]);
    // special case is when one is there and the other is not
    var hasPreInfo1 = preInfo1.length > 0;
    var hasPreInfo2 = preInfo2.length > 0;
    if (hasPreInfo1 && !hasPreInfo2) {
        return -1;
    } else if (!hasPreInfo1 && hasPreInfo2) {
        return 1;
    }
    // if both are there then compare the arrays
    if (result = compareArrays(preInfo1, preInfo2)) {
        return result;
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
    // update transaction timestamp
    transaction.timeStamp = timeStamp;
    transaction.deadline = deadline;
    // for multisig (transaction having otherTrans) update also the otherTrans
    if (transaction.otherTrans) {
        transaction.otherTrans.timeStamp = timeStamp;
        transaction.otherTrans.deadline = deadline;
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