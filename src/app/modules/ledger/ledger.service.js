import nem from "nem-sdk";
const TransportNodeHid = window['TransportNodeHid'] && window['TransportNodeHid'].default;
import NemH from "./hw-app-nem";
import SymbolH from "./hw-app-symbol";
const SUPPORT_VERSION = {
    LEDGER_MAJOR_VERSION: 0,
    LEDGER_MINOR_VERSION: 0,
    LEDGER_PATCH_VERSION: 4
}
let message;

/** Service storing Ledger utility functions. */
class Ledger {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Alert, $timeout) {
        'ngInject';

        // Service dependencies region //
        this._Alert = Alert;
        this._$timeout = $timeout;

        // End dependencies region //

        // Service properties region //

        // End properties region //

        // Initialization
    }

    // Service methods region //

    /**
     * Pop-up alert handler
     */
    alertHandler(inputErrorCode, isTxSigning, txStatusText, isSymbol) {
        switch (inputErrorCode) {
            case 'NoDevice':
                this._Alert.ledgerDeviceNotFound();
                break;
            case 26628:
                this._Alert.ledgerDeviceLocked();
                break;
            case 27904:
                this._Alert.ledgerNotOpenApp();
                break;
            case 27264:
                if (isSymbol) {
                    this._Alert.ledgerNotUsingSymbolApp();
                } else {
                    this._Alert.ledgerNotUsingNemApp();
                }
                break;
            case 27013:
                isTxSigning ? this._Alert.ledgerTransactionCancelByUser() : this._Alert.ledgerRequestCancelByUser();
                break;
            case 26368:
                this._Alert.ledgerTransactionTooBig();
                break;
            case 2:
                this._Alert.ledgerNotSupportApp();
                break;
            default:
                isTxSigning ? this._Alert.transactionError(txStatusText) : this._Alert.requestFailed(inputErrorCode);
                break;
        }
    }

    async createWallet(network) {
        return this.createAccount(network, 0, "Primary")
            .then((account) => ({
                "name": "LEDGER",
                "accounts": {
                    "0": account
                }
            }))
            .catch((err) => {
                throw err;
            });
    }

    bip44(network, index) {
        // recognize networkId by bip32Path;
        // "44'/43'/networkId'/walletIndex'/accountIndex'"
        const networkId = network < 0 ? 256 + network : network;
        return (`44'/43'/${networkId}'/${index}'/0'`);
    }


    createAccount(network, index, label) {
        const hdKeypath = this.bip44(network, index);
        return this.getAccount(hdKeypath, network, label);
    }

    addAccount(network, index, label) {
        const hdKeypath = this.bip44(network, index);
        return new Promise((resolve, reject) => {
            this.getAppVersion().then(checkVersion => {
                if (checkVersion === 1) {
                    alert("Please check your Ledger device!");
                    this._$timeout(() => {
                        this._Alert.ledgerFollowInstruction();
                    });

                    this.getAccount(hdKeypath, network, label).then((result) => {
                        resolve(result)
                    }).catch((error) => {
                        this._$timeout(() => {
                            this.alertHandler(error);
                        });
                        reject(true);
                    });

                } else {
                    this._$timeout(() => {
                        this.alertHandler(checkVersion);
                    });
                    reject(true);
                }
            }).catch(error => {
                this._$timeout(() => {
                    this.alertHandler(error);
                });
                reject(true);
            });
        });
    }

    showAccount(account) {
        alert("Please check your Ledger device!");
        this._Alert.ledgerFollowInstruction();
        return new Promise((resolve, reject) => {
            this.getAccount(account.hdKeypath, account.network, (result) => {
                if (result.success) {
                    resolve(result.address);
                } else {
                    reject(result.error);
                }
            });
        });
    }

    showSymbolAccount(account) {
        alert("Please check your Ledger device!");
        this._Alert.ledgerFollowInstruction();
        return new Promise((resolve, reject) => {
            this.getSymbolAccount(account.hdKeypath, account.network).then((result) => {
                resolve(result.publicKey);
            }).catch(e => {
                this._$timeout(() => {
                    this.alertHandler(e, undefined, undefined, true);
                    reject(e);
                });
            });
        });
    }

    async getAccount(hdKeypath, network, label) {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const result = await nemH.getAddress(hdKeypath);
                return Promise.resolve(
                    {
                        "brain": false,
                        "algo": "ledger",
                        "encrypted": "",
                        "iv": "",
                        "address": result.address,
                        "label": label,
                        "network": network,
                        "child": "",
                        "hdKeypath": hdKeypath,
                        "publicKey": result.publicKey
                    }
                );
            } catch (err) {
                throw err
            } finally {
                transport.close();
            }
        } catch (err) {
            if (err.statusCode != null) {
                return Promise.reject(err.statusCode);
            } else if (err.id != null) {
                return Promise.reject(err.id);
            } else {
                return Promise.reject(err);
            }
        }
    }

    async getSymbolAccount(hdKeypath, network) {
        try {
            const transport = await TransportNodeHid.open("");
            const symbolH = new SymbolH(transport);
            try {
                return await symbolH.getAccount(hdKeypath, network, true);
            } catch (err) {
                throw err
            } finally {
                transport.close();
            }
        } catch (err) {
            if (err.statusCode != null) {
                return Promise.reject(err.statusCode);
            } else if (err.id != null) {
                return Promise.reject(err.id);
            } else {
                return Promise.reject(err);
            }
        }
    }

    async getRemoteAccount(hdKeypath) {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const result = await nemH.getRemoteAccount(hdKeypath)
                return Promise.resolve(
                    {
                        "hdKeypath": hdKeypath,
                        "remoteAccount": result.remoteAccount
                    }
                );
            } catch (err) {
                throw err
            } finally {
                transport.close();
            }
        } catch (err) {
            if (err.statusCode != null) {
                return Promise.reject(err.statusCode);
            } else if (err.id != null) {
                return Promise.reject(err.id);
            } else {
                return Promise.reject(err);
            }
        }
    }

    deriveRemote(account, network) {
        return new Promise((resolve, reject) => {
            this.getAppVersion().then(checkVersion => {
                if (checkVersion == 1) {
                    alert("Please check your Ledger device!");
                    this._$timeout(() => {
                        this._Alert.ledgerFollowInstruction();
                    });

                    this.getRemoteAccount(account.hdKeypath).then((result) => {
                        const privateKey = result.remoteAccount;
                        const keyPair = nem.crypto.keyPair.create(privateKey);
                        const publicKey = keyPair.publicKey.toString();
                        const address = nem.model.address.toAddress(publicKey, network);
                        resolve({
                            address,
                            privateKey,
                            publicKey
                        });
                    }).catch((error) => {
                        this._$timeout(() => {
                            this.alertHandler(error);
                        });
                        reject('handledLedgerErrorSignal');
                    });
                } else {
                    this._$timeout(() => {
                        this.alertHandler(checkVersion);
                    });
                    reject('handledLedgerErrorSignal');
                }
            }).catch(error => {
                this._$timeout(() => {
                    this.alertHandler(error);
                });
                reject('handledLedgerErrorSignal');
            });
        });
    }

    serialize(transaction, account) {
        return new Promise(async (resolve, reject) => {
            this.getAppVersion().then(async checkVersion => {
                if (checkVersion === 1) {
                    alert("Please check your Ledger device!");
                    this._$timeout(() => {
                        this._Alert.ledgerFollowInstruction();
                    });
                    //Transaction with testnet and mainnet
                    //Correct the signer
                    transaction.signer = account.publicKey;
                    //If it is a MosaicDefinition Creation Transaction, then correct the creator
                    if (transaction.type == 0x4001) {
                        transaction.mosaicDefinition.creator = account.publicKey;
                    }

                    //Serialize the transaction
                    let serializedTx = nem.utils.convert.ua2hex(nem.utils.serialization.serializeTransaction(transaction));
                    // If it is a Multisig Signature Transaction, then add more transaction payload to the serialized transaction
                    if (transaction.type == 0x1002) {
                        // If the inner transaction is mosaic creation and there's no levy field in it
                        if (transaction.otherTrans.type == 0x4001 && transaction.otherTrans.mosaicDefinition.levy != null && transaction.otherTrans.mosaicDefinition.levy.type == undefined) {
                            transaction.otherTrans.mosaicDefinition.levy = null;
                        }
                        // If the inner transaction is transfer and there's no message field in it
                        if (transaction.otherTrans.type == 0x0101 && transaction.otherTrans.message.type == undefined) {
                            transaction.otherTrans.message.type = 1;
                            transaction.otherTrans.message.payload = "";
                        }
                        let otherTrans = nem.utils.convert.ua2hex(nem.utils.serialization.serializeTransaction(transaction.otherTrans));
                        let otherTransLength = ("00000000" + (otherTrans.length / 2).toString(16)).substr(-8);
                        let otherTransLengthReverse = otherTransLength.match(/[a-fA-F0-9]{2}/g).reverse().join('');
                        serializedTx = serializedTx + otherTransLengthReverse + otherTrans;
                    }
                    let payload = await this.signTransaction(account, serializedTx);
                    if (payload.signature) {
                        resolve(payload);
                    } else {
                        this._$timeout(() => {
                            this.alertHandler(payload.statusCode, true, payload.statusText);
                        });
                        reject(payload);
                    }
                } else {
                    this._$timeout(() => {
                        this.alertHandler(checkVersion, true);
                    });
                    reject(true);
                }
            }).catch(error => {
                this._$timeout(() => {
                    this.alertHandler(error);
                });
                reject(true);
            });
        });
    }

    async signTransaction(account, serializedTx) {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const sig = await nemH.signTransaction(account.hdKeypath, serializedTx);
                let payload = {
                    data: serializedTx,
                    signature: sig.signature
                }
                return Promise.resolve(payload);
            }
            catch (err) {
                throw err
            } finally {
                transport.close();
            }
        } catch (err) {
            if (err.statusCode != null) {
                return Promise.resolve(err);
            } else if (err.id != null) {
                return Promise.resolve(err.id);
            } else if (err.name == "TransportError") {
                this._Alert.ledgerFailedToSignTransaction(err.message);
                return;
            } else {
                return Promise.resolve(err);
            }
        }
    }

    /**
     * Get NEM Ledger app version
     */
    async getAppVersion() {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const result = await nemH.getAppVersion();
                let appVersion = result;
                if (appVersion.majorVersion == null && appVersion.minorVersion == null && appVersion.patchVersion == null) {
                    if (result.statusCode != null) {
                        return Promise.reject(result.statusCode);
                    } else {
                        return Promise.reject(result.id);
                    }
                } else {
                    let statusCode;
                    if (appVersion.majorVersion < SUPPORT_VERSION.LEDGER_MAJOR_VERSION) {
                        statusCode = 2;
                    } else if (appVersion.minorVersion < SUPPORT_VERSION.LEDGER_MINOR_VERSION) {
                        statusCode = 2;
                    } else if (appVersion.patchVersion < SUPPORT_VERSION.LEDGER_PATCH_VERSION) {
                        statusCode = 2;
                    } else {
                        statusCode = 1;
                    }
                    return Promise.resolve(statusCode);
                }
            } catch (err) {
                throw err
            } finally {
                transport.close();
            }
        } catch (err) {
            if (err.statusCode != null) {
                return Promise.reject(err.statusCode);
            } else if (err.id != null) {
                return Promise.reject(err.id);
            } else {
                return Promise.reject(err);
            }
        }
    }

}

// End methods region //

export default Ledger;
