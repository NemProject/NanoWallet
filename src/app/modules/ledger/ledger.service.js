import nem from "nem-sdk";
const TransportNodeHid = window['TransportNodeHid'] && window['TransportNodeHid'].default;
import NemH from "./hw-app-nem";
const SUPPORT_VERSION = {
    LEDGER_MAJOR_VERSION: 0,
    LEDGER_MINOR_VERSION: 0,
    LEDGER_PATCH_VERSION: 2
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
        const networkId = network == -104 ? 152 : 104;
        return (`44'/43'/${networkId}'/${index}'/0'`);
    }


    createAccount(network, index, label) {
        const hdKeypath = this.bip44(network, index);
        return this.getAccount(hdKeypath, network, label);
    }

    showAccount(account) {
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

    async getAccount(hdKeypath, network, label) {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const result = await nemH.getAddress(hdKeypath)
                transport.close();
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
                transport.close();
                throw err
            }
        } catch (err) {
            if (err.statusCode != null) return Promise.reject(err.statusCode);
            else if (err.id != null) return Promise.resolve(err.id);
            else return Promise.resolve(err);
        }
    }

    async getRemoteAccount(hdKeypath) {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const result = await nemH.getRemoteAccount(hdKeypath)
                transport.close();
                return Promise.resolve(
                    {
                        "hdKeypath": hdKeypath,
                        "remoteAccount": result.remoteAccount
                    }
                );
            } catch (err) {
                transport.close();
                throw err
            }
        } catch (err) {
            if (err.statusCode != null) return Promise.reject(err.statusCode);
            else if (err.id != null) return Promise.resolve(err.id);
            else return Promise.resolve(err);
        }
    }

    deriveRemote(account, network) {
        this._$timeout(() => {
            this._Alert.ledgerFollowInstruction();
        });
        return new Promise((resolve, reject) => {
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
            });
        });
    }

    serialize(transaction, account, symbolOptin) {
        this._$timeout(() => {
            this._Alert.ledgerFollowInstruction();
        });
        return new Promise(async (resolve, reject) => {
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
                if (!symbolOptin) {
                    if (payload.statusCode == '26368') {
                        this._Alert.ledgerTransactionTooBig();
                    } else if (payload.statusCode == '27013') {
                        this._Alert.ledgerTransactionCancelByUser();
                    } else {
                        this._Alert.transactionError(payload.statusText);
                    }
                }
                reject(payload);
            }

        });
    }

    async signTransaction(account, serializedTx) {
        try {
            const transport = await TransportNodeHid.open("");
            const nemH = new NemH(transport);
            try {
                const sig = await nemH.signTransaction(account.hdKeypath, serializedTx)
                transport.close();
                let payload = {
                    data: serializedTx,
                    signature: sig.signature
                }
                return Promise.resolve(payload);
            }
            catch (err) {
                transport.close();
                throw err
            }
        } catch (err) {
            if (err.statusCode != null) return Promise.resolve(err);
            else if (err.id != null) return Promise.resolve(err.id);
            else if (err.name == "TransportError") {
                this._Alert.ledgerFailedToSignTransaction(err.message);
                return;
            }
            else return Promise.resolve(err);
        }
    }
}

// End methods region //

export default Ledger;
