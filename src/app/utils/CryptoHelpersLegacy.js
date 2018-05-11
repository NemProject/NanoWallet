/** @module utils/CryptoHelpersLegacy */

import BigInteger from 'bigi';
import CryptoJS from 'crypto-js';
import bitcoin from 'bitcoinjs-lib';
import ecurve from 'ecurve';

let curve = ecurve.getCurveByName("secp256k1");

/**
 * Generate legacy BIP32 hash
 *
 * This is required because the BIP32 implementation is non-standard
 * and uses SHA3 and the password to convert the seed and uses SHA256
 * for child derivation.
 *
 * @param {object} hasher - A CryptoJS hasher
 * @param {WordArray|string} key - The secret key
 * @param {WordArray|string} message - The message
 */
let createBIP32Hash = function (hasher, key, message) {
    let hash = CryptoJS.algo.HMAC.create(hasher, key).finalize(message);

    let I  = CryptoJS.enc.Hex.stringify(hash);

    let IL = I.slice(0, 64);
    let IR = I.slice(64);

    let keyPair = new bitcoin.ECPair(BigInteger.fromHex(IL));
    let chainCode = CryptoJS.enc.Hex.parse(IR);

    return {
        keyPair,
        chainCode,
    };
};

/**
 * Generate legacy BIP32 child key
 *
 * This is not a proper implementation of BIP32 as it uses
 * HMAC-SHA256 instead of HMAC-SHA512. This results in a blank
 * chain code. It is not secure to perform more than one child
 * derivation.
 *
 * @param {string} privateKey - A private key
 * @param {string} password - A wallet password
 * @param {number} index - A derivation index
 *
 * @return {string} - The child private key
 */
let generateBIP32Data = function (privateKey, password, index) {
    /* Hash the hex-encoded private key */
    let hash = CryptoJS.SHA3(privateKey, { outputLength: 256 });

    let rootNode = createBIP32Hash(CryptoJS.algo.SHA3, password, hash);

    /* Serialize (publicKey || index) */
    let data = Buffer.allocUnsafe(37);
    rootNode.keyPair.getPublicKeyBuffer().copy(data, 0);
    data.writeUInt32BE(index, 33);
    let message = CryptoJS.enc.Hex.parse(data.toString("hex"));

    /* This will produce a blank chain code */
    let childNode = createBIP32Hash(CryptoJS.algo.SHA256, rootNode.chainCode, message);

    let pIL = childNode.keyPair.d.add(rootNode.keyPair.d).mod(curve.n);
    return pIL.toHex(32);
};

module.exports = {
    generateBIP32Data,
};
