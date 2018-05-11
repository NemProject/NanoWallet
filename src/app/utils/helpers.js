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
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * From http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 */
let versionCompare = function(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

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