import nem from 'nem-sdk';
import {
    buildCosignDTO,
    buildNormalOptInDTOs,
    MultisigCache,
    NormalCache,
    OptinConstants,
    status,
    hasOptInStopped
} from "catapult-optin-module";
import {PublicAccount, NetworkType, Account} from "symbol-sdk";
import {broadcastDTO, buildStartMultisigOptInDTOs} from "catapult-optin-module/dist/src/Broadcast";


/** Service with relative functions on symbol opt in books. */
class CatapultOptin {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, Wallet, Trezor, Ledger, DataStore, Alert) {
        'ngInject';

        this.normalCaches = {};
        this.multisigCaches = {};
        // Service dependencies region //

        this._storage = $localStorage;
        this._Wallet = Wallet;
        this._DataStore = DataStore;
        this._Trezor = Trezor;
        this._Ledger = Ledger;
        this._Alert = Alert;
        // End dependencies region //

        // Service properties region //

        // End properties region //
    }

    // Service methods region //

    /**
     * Returns optin config
     *
     * @return {{NISConfigAccount: string, NISStopAccount: string, NISNetwork: *, NISEndpoint: *, CATNetwork: *}}
     */
    getOptinConfig() {
        let CATNetwork, NISStopAccount;
        if (this._Wallet.network === nem.model.network.data.testnet.id){
            CATNetwork = NetworkType.TEST_NET;
            NISStopAccount = 'TAXF5HUGBKGSC3MOJCRXN5LLKFBY43LXI3DE2YLS';
        }
        else if (this._Wallet.network === nem.model.network.data.mainnet.id) {
            CATNetwork = NetworkType.MAIN_NET;
            NISStopAccount = 'NAWIP6WBLEAHUHWJ757Q2UXTVE3DYVDNNDAVWLUZ';
        }
        else if (this._Wallet.network === nem.model.network.data.mijin.id) {
            CATNetwork = NetworkType.MIJIN;
        }
        else {
            CATNetwork = NetworkType.MIJIN_TEST;
        }
        return {
            NISConfigAccount: OptinConstants[CATNetwork].CONFIG_ACCOUNT,
            NISStopAccount: NISStopAccount,
            NISEndpoint: this._Wallet.node,
            NISNetwork: this._Wallet.network,
            CATNetwork: CATNetwork,
        };
    }

    getSymbolOptInAddress(hdPath) {
        const config = this.getOptinConfig();
        return new Promise((resolve, reject) => {
            this._Ledger.showSymbolAccount({ hdKeypath: hdPath, network: config.CATNetwork })
                .then(publicKey => {
                    const publicAccount = PublicAccount.createFromPublicKey(publicKey, config.CATNetwork);
                    resolve(publicAccount);
                }).catch(e => {
                    console.log(e);
                    reject(e);
            })
        });
    }

    getNormalCache(account, forceRefresh = false) {
        return new Promise(resolve => {
            if (!this.normalCaches[account.account.address] || forceRefresh) {
                const cache = new NormalCache(account, this.getOptinConfig());
                cache.loadFromChain().then(_ => {
                    this.normalCaches[account.account.address] = cache;
                    resolve(cache);
                });
            }
            else {
                resolve(this.normalCaches[account.account.address]);
            }
        })

    }

    getMultisigCache(account, forceRefresh = false) {
        return new Promise(resolve => {
            if (!this.multisigCaches[account.account.address] || forceRefresh) {
                const cache = new MultisigCache(account, this.getOptinConfig());
                cache.loadFromChain().then(_ => {
                    this.multisigCaches[account.account.address] = cache;
                    resolve(cache);
                });
            }
            else {
                resolve( this.multisigCaches[account.account.address] );
            }
        })
    }

    /**
     * Sends simple optin status
     *
     * @param common
     * @param destination
     * @param namespaces
     * @param vrfAccount
     */
    sendSimpleOptin(common, destination, namespaces, vrfAccount) {
        return new Promise( (resolve, reject) => {
            const config = this.getOptinConfig();
            buildNormalOptInDTOs(destination, namespaces, vrfAccount, config).then(dtos => {
                if (this._Wallet.algo == "trezor") {
                    this._sendTrezorDTOs(common, dtos).then(resolve).catch(reject);
                } else if (this._Wallet.algo == "ledger") {
                    this._sendLedgerDTOs(common, dtos).then(resolve).catch(reject);
                } else {
                    const sendPromises = dtos.map(dto => broadcastDTO(common.privateKey, dto, config));
                    Promise.all(sendPromises).then(messages => {
                        if (messages.filter(_ => _ !== 'SUCCESS').length > 0) {
                            reject('Sending OptIn failed: ' + messages.toString());
                        } else {
                            resolve(true);
                        }
                    }).catch(reject);
                }
            }).catch(reject);
        });
    }

    /**
     * Signs and Sends DTOS via trezor
     *
     * @param common
     * @param dtos
     */
    _sendTrezorDTOs(common, dtos) {
        return new Promise((resolve, reject) => {
            Promise.all( dtos.map( dto => this.createTransactionFromDTO(dto, common))).then( transactions => {
                const signTransaction = (i) => {
                    return this._Trezor.serialize(transactions[i], this._Wallet.currentAccount).then( serialized => {
                        if (transactions.length - 1 === i) {
                            return [JSON.stringify(serialized)];
                        }
                        return new Promise(resolve => setTimeout( () => signTransaction(i + 1).then((next) => {
                            resolve([JSON.stringify(serialized)].concat(next));
                        }).catch(err => resolve([null])), 500));
                    }).catch(err => {
                        reject(err.data.message);
                    });
                };
                signTransaction(0).then((signedTransactions) => {
                    if (signedTransactions.filter(_ => _ != null).length === dtos.length){
                        Promise.all(signedTransactions.map( signedTransaction => nem.com.requests.transaction.announce(this._Wallet.node, signedTransaction)))
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject('Transaction not signed');
                    }

                }).catch(reject);
            });
        });
    }

    /**
     * Signs and Sends DTOS via Ledger
     *
     * @param common
     * @param dtos
     */
    _sendLedgerDTOs(common, dtos) {
        return new Promise((resolve, reject) => {
            Promise.all( dtos.map( dto => this.createTransactionFromDTO(dto, common))).then( transactions => {
                const signTransaction = (i) => {
                    return this._Ledger.serialize(transactions[i], this._Wallet.currentAccount).then( serialized => {
                        if (transactions.length - 1 === i) {
                            return [JSON.stringify(serialized)];
                        }
                        return new Promise(resolve => signTransaction(i + 1).then((next) => {
                            resolve([JSON.stringify(serialized)].concat(next));
                        }).catch(err => resolve([null])));
                    }).catch(_ => {
                        reject('handledLedgerErrorSignal');
                    });
                };
                signTransaction(0).then((signedTransactions) => {
                    if (signedTransactions.filter(_ => _ != null).length === dtos.length){
                        Promise.all(signedTransactions.map( signedTransaction => nem.com.requests.transaction.announce(this._Wallet.node, signedTransaction)))
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject('Transaction not signed');
                    }

                }).catch(reject);
            });
        });
    }

    /**
     * Creates a transaction from a dto
     *
     * @param dto
     * @param common
     */
    createTransactionFromDTO(dto, common){
        let configTransaction = nem.model.objects.create("transferTransaction")(this.getOptinConfig().NISConfigAccount, 0, dto.toMessage());
        // Prepare with Signer and Network
        configTransaction = nem.model.transactions.prepare("transferTransaction")(
            common,
            configTransaction,
            this._Wallet.network
        );
        return new Promise( (resolve) => {
            nem.com.requests.chain.time(this._Wallet.node).then( time => {
                configTransaction.timeStamp = Math.floor(time.receiveTimeStamp / 1000);
                configTransaction.deadline = configTransaction.timeStamp + 60 * 60;
                resolve(configTransaction);
            });
        });
    }

    /**
     * Get simple optin status
     */
    getStatus(originAddress) {
        return new Promise( (resolve) => {
            nem.com.requests.account.data(this._Wallet.node, originAddress).then( origin => {
                const config = this.getOptinConfig();
                if (origin.meta.cosignatories.length > 0) {
                    this.getMultisigCache(origin, true).then( cache => {
                        status(origin, config, cache).then(resolve);
                    });
                } else {
                    this.getNormalCache(origin, true).then( cache => {
                        status(origin, config).then(resolve);
                    });
                }
            });
        });
    }

    /**
     * Send multisig start opt in
     *
     * @param common
     * @param originAddress
     * @param cosigner
     * @param destination
     * @param namespaces
     * @return {Promise<unknown>}
     */
    sendMultisigStartOptIn(common, originAddress, cosigner, destination, namespaces) {
        const config = this.getOptinConfig();
        return new Promise((resolve, reject) => {
            nem.com.requests.account.data(this._Wallet.node, originAddress).then(origin => {
                buildStartMultisigOptInDTOs(origin, cosigner, destination, namespaces, config).then( dtos => {
                    if (this._Wallet.algo == "trezor") {
                        this._sendTrezorDTOs(common, dtos).then(resolve).catch(reject);
                    } else if (this._Wallet.algo == "ledger") {
                        this._sendLedgerDTOs(common, dtos).then(resolve).catch(reject);
                    } else {
                        const sendPromises = dtos.map(dto => broadcastDTO(common.privateKey, dto, config));
                        Promise.all(sendPromises).then(messages => {
                            if (messages.filter(_ => _ !== 'SUCCESS').length > 0) {
                                reject('Sending OptIn failed: ' + messages.toString());
                            } else {
                                resolve(true);
                            }
                        }).catch(reject);
                    }
                }).catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Send multisig optin cosig
     *
     * @return {Promise<any>}
     * @param common
     * @param originAddress
     * @param cosigner
     * @param destination
     */
    sendMultisigSignOptIn(common, originAddress, cosigner, destination) {
        const config = this.getOptinConfig();
        return new Promise((resolve, reject) => {
            nem.com.requests.account.data(this._Wallet.node, originAddress).then(origin => {
                buildCosignDTO(origin, cosigner, destination, config).then(cosignDTO => {
                     this.createTransactionFromDTO(cosignDTO, common).then( transaction => {
                        this._Wallet.transact(common, transaction)
                            .then(resolve)
                            .catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Checks if opt in has stopped
     * @return {boolean}
     */
    checkIfOptinHasStopped() {
        const config = this.getOptinConfig();
        return hasOptInStopped(config.NISStopAccount, config);
    }

    // End methods region //

}

export default CatapultOptin;
