import { TransactionTypes } from 'nem-library';
import nem from 'nem-sdk';
import TrezorConnect from 'trezor-connect';

/** Service storing Trezor utility functions. */
class Trezor {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor() {
        'ngInject';

        // Service dependencies region //

        // End dependencies region //

        // Service properties region //

        // End properties region //
        TrezorConnect.manifest({ email: 'maintainers@nem.io', appUrl: 'https://www.nem.io' });
    }

    // Service methods region //

    createWallet(network, account_id, account_text) {
        return this.createAccount(network, account_id, account_text).then((account) => ({
            "name": "TREZOR",
            "accounts": {
                "0": account
            }
        }));
    }

    bip44(network, index) {
        const coinType = network == -104 ? 1 : 43;

        return `m/44'/${coinType}'/${index}'/0'/0'`;
    }

    adjustNetwork(network) {
        return network < 0 ? 256 + network : network;
    }

    createAccount(network, index, label) {
        return new Promise((resolve, reject) => {
            const hdKeypath = this.bip44(network, index);
            TrezorConnect.nemGetAddress({
                path: hdKeypath,
                network: this.adjustNetwork(network),
                showOnTrezor: true
            }).then(function(result) {
                if (result.success) {
                    resolve({
                        "brain": false,
                        "algo": "trezor",
                        "encrypted": "",
                        "iv": "",
                        "address": result.payload.address,
                        "label": label,
                        "network": network,
                        "child": "",
                        "hdKeypath": hdKeypath
                    });
                } else {
                    reject(result.payload.error);
                }
            })
        });
    }

    deriveRemote(account, network) {
        const key = "Export delegated harvesting key?";
        const value = "0000000000000000000000000000000000000000000000000000000000000000";

        return new Promise((resolve, reject) => {
            TrezorConnect.cipherKeyValue({
                path: account.hdKeypath,
                key: key,
                value: value,
                encrypt: true,
                askOnEncrypt: true,
                askOnDecrypt: true
            }).then(function(result) {
                if (result.success) {
                    const privateKey = nem.utils.helpers.fixPrivateKey(result.payload.value);
                    const keyPair = nem.crypto.keyPair.create(privateKey);
                    const publicKey = keyPair.publicKey.toString();
                    const address = nem.model.address.toAddress(publicKey, network);

                    resolve({
                        address,
                        privateKey,
                        publicKey
                    });
                } else {
                    reject(result.payload.error);
                }
            })
        });
    }

    /**
     * Adjusts importance transfer transaction to be compatible with Trezor
     * 
     * @param {Object} transaction - Transaction to adjust
     * @returns the adjusted transaction or the same transaction (if not an importance transfer)
     */
    adjustImportanceTransferTransaction(transaction) {
        if (transaction.type === TransactionTypes.IMPORTANCE_TRANSFER) {
            Object.assign(transaction, {
              importanceTransfer: {
                mode: transaction.mode,
                publicKey: transaction.remoteAccount,
              },
            });
        }
        return transaction;
    }

    serialize(transaction, account) {
        const tx = this.adjustImportanceTransferTransaction(transaction);

        return new Promise((resolve, reject) => {
          TrezorConnect.nemSignTransaction({
            path: account.hdKeypath,
            transaction: tx,
          }).then(function (result) {
            if (result.success) {
              resolve(result.payload);
            } else {
              reject({
                code: 0,
                data: {
                  message: result.payload.error,
                },
              });
            }
          });
        });
    }

    showAccount(account) {
        return new Promise((resolve, reject) => {
            TrezorConnect.nemGetAddress({
                path: account.hdKeypath,
                network: this.adjustNetwork(account.network),
                showOnTrezor: true
            }).then(function(result) {
                if (result.success) {
                    resolve(result.payload.address);
                } else {
                    reject(result.payload.error);
                }
            })
        });
    }

    // End methods region //

}

export default Trezor;
