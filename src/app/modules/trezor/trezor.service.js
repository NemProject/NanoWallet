import nem from 'nem-sdk';

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

    createAccount(network, index, label) {
        return new Promise((resolve, reject) => {
            const hdKeypath = this.bip44(network, index);

            TrezorConnect.nemGetAddress(hdKeypath, network, (result) => {
                if (result.success) {
                    resolve({
                        "brain": false,
                        "algo": "trezor",
                        "encrypted": "",
                        "iv": "",
                        "address": result.address,
                        "label": label,
                        "network": network,
                        "child": "",
                        "hdKeypath": hdKeypath
                    });
                } else {
                    reject(result.error);
                }
            });
        });
    }

    deriveRemote(account, network) {
        const key = "Export delegated harvesting key?";
        const value = "0000000000000000000000000000000000000000000000000000000000000000";

        return new Promise((resolve, reject) => {
            TrezorConnect.cipherKeyValue(account.hdKeypath, key, value, true, true, true, (result) => {
                if (result.success) {
                    const privateKey = nem.utils.helpers.fixPrivateKey(result.value);
                    const keyPair = nem.crypto.keyPair.create(privateKey);
                    const publicKey = keyPair.publicKey.toString();
                    const address = nem.model.address.toAddress(publicKey, network);

                    resolve({
                        address,
                        privateKey,
                        publicKey
                    });
                } else {
                    reject(result.error);
                }
            });
        });
    }

    serialize(transaction, account) {
        return new Promise((resolve, reject) => {
            TrezorConnect.nemSignTx(account.hdKeypath, transaction, (result) => {
                if (result.success) {
                    resolve(result.message);
                } else {
                    reject({
                        "code": 0,
                        "data": {
                            "message": result.error
                        }
                    });
                }
            });
        });
    }

    showAccount(account) {
        return new Promise((resolve, reject) => {
            TrezorConnect.nemGetAddress(account.hdKeypath, account.network, (result) => {
                if (result.success) {
                    resolve(result.address);
                } else {
                    reject(result.error);
                }
            });
        });
    }

    // End methods region //

}

export default Trezor;
