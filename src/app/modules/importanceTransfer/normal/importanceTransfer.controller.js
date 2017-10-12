import CryptoHelpers from '../../../utils/CryptoHelpers';
import Address from '../../../utils/Address';
import Network from '../../../utils/Network';
import helpers from '../../../utils/helpers';
import Nodes from '../../../utils/nodes';

class ImportanceTransferCtrl {
    constructor($location, Wallet, Alert, Transactions, $filter, DataBridge, NetworkRequests, $timeout, AppConstants, $localStorage) {
        'ngInject';

        // Alert service
        this._Alert = Alert;
        // $location to redirect
        this._location = $location;
        // Wallet service
        this._Wallet = Wallet;
        // Transactions service
        this._Transactions = Transactions;
        // Filters
        this._$filter = $filter;
        this._DataBridge = DataBridge;
        this._NetworkRequests = NetworkRequests;
        this._$timeout = $timeout;
        this._storage = $localStorage;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }
 
        /**
         *  Default importance transfer transaction properties  
         */
        this.formData = {};
        // Remote account address for view
        this.remoteAccountAddress = Address.toAddress(this._Wallet.currentAccount.child, this._Wallet.network);
        // Remote account public key
        this.formData.remoteAccount = this._Wallet.currentAccount.child;
        // Account generated from custom public key
        this.generatedRemoteAccount = '';
        this.formData.mode = 1;
        this.formData.fee = 0;
        // Multisig data
        // Here we won't use multisig as it needs special handling
        this.formData.innerFee = 0;
        this.formData.isMultisig = false;
        this.formData.multisigAccount = '';

        // Not using custom node by default
        this.customHarvestingNode = false;
        this.harvestingNode = helpers.getHostname(this._Wallet.node);
        // Consider node has no free slots by default
        this.noFreeSlots = true;
        // Array to contain nodes
        this.nodes = [];
        // Show supernodes by default on mainnet
        this.showSupernodes = true;
        // initial delegated account data
        this.delegatedData = this._DataBridge.delegatedData;

        // Needed to prevent user to click twice on send when already processing
        this.okPressed = false;

         // Needed to prevent getFreeNode endless loop
        this.freeNodeLooped = 0;

        //Hostname with free slots
        this.hostNameFreeSlots;

        //Set to show free host found
        this.freeHostFound=false;

        // Object to contain our password & private key data for importance transfer.
        this.common = {
            'password': '',
            'privateKey': ''
        };

        // Object to contain our password & private key data to reveal delegated private key.
        this.commonDelegated = {
            'password': '',
            'privateKey': '',
            'delegatedPrivateKey': ''
        };

        // Object to contain our password & private key data to start/stop harvesting.
        this.commonHarvesting = {
            'password': '',
            'privateKey': ''
        }

        // Modes
        this.modes = [{
            name: this._$filter('translate')('IMPORTANCE_TRANSFER_MODE_1'),
            key: 1
        }, {
            name: this._$filter('translate')('IMPORTANCE_TRANSFER_MODE_2'),
            key: 2
        }];

        // Not using custom public key by default
        this.customKey = false;

        // Show right nodes list according to network
        if (this._Wallet.network == Network.data.Mainnet.id) {
            // Get supernodes
            this._NetworkRequests.getSupernodes().then((data) => {
                    this.nodes = data.data.nodes;
                },
                (err) => {
                    // Set default nodes
                    this.nodes = Nodes.mainnetNodes;
                    this._Alert.supernodesError();
                })
        } else if (this._Wallet.network == Network.data.Testnet.id) {
            this.nodes = Nodes.testnetNodes;
            this.showSupernodes = false;
        } else {
            this.nodes = Nodes.mijinNodes;
            this.showSupernodes = false;
        }

        // Update fee
        this.updateFee();

        this.getNodeInLocalStorage();
        // Check default node slots
        this.checkNode();
        // Update delegated data
        this.updateDelegatedData();

    }

    /**
     * getFreeNode() gets a node with free slots
     */
     getFreeNode(){
        this.freeHostFound=false;
        // to prevent endless loop, loops are count 
        if (this.freeNodeLooped < 200) {
            this.freeNodeLooped++;
            //regex expression to get the ip from string
            var regExpIpCheck = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
            //select a random node from the nodelist provided
            var randomNode = this.nodes[Math.floor(Math.random()*this.nodes.length)];
            var hostName;

            //Nodes for test are diferent provided than Mainnet
            if (this._Wallet.network == Network.data.Mainnet.id) {
                hostName = randomNode.ip;
            }
            else{
                hostName= randomNode.uri.match(regExpIpCheck);
            }
            //set hostNameFreeSlot so you can follow in the app on whish node it`s working on
            this.hostNameFreeSlots = hostName;

            if (regExpIpCheck.test(hostName) || (this._Wallet.network == Network.data.Mainnet.id)) {
                 this._NetworkRequests.getUnlockedInfo(hostName).then((data,) => {
                if (data["max-unlocked"] === data["num-unlocked"]) {
                        this.getFreeNode();
                    } 
                    else {
                        this.freeHostFound=true;

                    }
                },
                (err) => {
                    console.error(err)
                    this._Alert.unlockedInfoError(err.data.message);
                });
             }

             else if (!regExpIpCheck.test(hostName) || (this._Wallet.network == Network.data.Testnet.id)) {
                this.getFreeNode();

             };
         }
         // to prevent endless loop, loops are count
         else    {
            this.freeNodeLooped = 0;
            this.hostNameFreeSlots = "";
            this._Alert.endlessLoopProtection();
         }
     }

    /**
     * checkNode() Check node slots
     */
    checkNode(){
        this.noFreeSlots = true;
            this._NetworkRequests.getUnlockedInfo(this.harvestingNode).then((data) => {
                    if (data["max-unlocked"] === data["num-unlocked"]) {
                        this.noFreeSlots = true;
                    } else {
                        this.noFreeSlots = false;
                    }
                },
                (err) => {
                    console.error(err)
                    this._Alert.unlockedInfoError(err.data.message);
                });
    }

    /**
     * Generate address of the custom public key
     */
    generateAddress() {
        if(this.formData.remoteAccount.length === 64) {
           this.generatedRemoteAccount = Address.toAddress(this.formData.remoteAccount, this._Wallet.network);
        } else {
            this.generatedRemoteAccount = '';
        }
    }

    /**
     * updateFee() Update transaction fee
     */
    updateFee() {
        let entity = this._Transactions.prepareImportanceTransfer(this.common, this.formData);
        this.formData.fee = entity.fee;
    }

    /**
     * updateRemoteAccount() Update the remote account public key
     */
    updateRemoteAccount() {
        if (this.customKey) {
            this.formData.remoteAccount = '';
            this.generatedRemoteAccount = '';
        } else {
            this.formData.remoteAccount = this._Wallet.currentAccount.child;
        }
    }

    /**
     * revealDelegatedPrivateKey() Reveal the delegated private key
     */
    revealDelegatedPrivateKey() {
         // Decrypt/generate private key and check it. Returned private key is contained into this.commonDelegated
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.commonDelegated, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            return;
        } else if (!CryptoHelpers.checkAddress(this.commonDelegated.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            return;
        }
        
        // Generate the bip32 seed for the new account
        CryptoHelpers.generateBIP32Data(this.commonDelegated.privateKey, this.commonDelegated.password, 0, this._Wallet.network).then((data) => {
            this._$timeout(() => {
                this.commonDelegated.delegatedPrivateKey = data.privateKey;
            }, 0)
        },
        (err) => {
            this._$timeout(() => {
                this._Alert.bip32GenerationFailed(err);
                 return;
            }, 0);
        });
    }

    /**
     * startDelegatedHarvesting() Start delegated harvesting, set chosen node in wallet service and local storage
     */
    startDelegatedHarvesting() {
        // Decrypt/generate private key and check it. Returned private key is contained into this.commonHarvesting
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.commonHarvesting, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            return;
        } else if (!CryptoHelpers.checkAddress(this.commonHarvesting.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            return;
        }
        // Generate remote data of the account
        CryptoHelpers.generateBIP32Data(this.commonHarvesting.privateKey, this.commonHarvesting.password, 0, this._Wallet.network).then((result) => {
                this._NetworkRequests.unlockAccount(this.harvestingNode, result.privateKey).then((data) => {
                        if (data.status == 200) {
                            // Update delegated data
                            this.updateDelegatedData();
                            // Clean data
                            this.clearSensitiveData();
                        }
                    },
                    (err) => {
                        console.error(err)
                        this._Alert.unlockError(err.data.message);
                        return;
                    })
            },
            (err) => {
                this._$timeout(() => {
                    this._Alert.derivationFromSeedFailed(err);
                    return;
                }, 0);
            });
    }

    /**
     * stopDelegatedHarvesting() Stop delegated harvesting
     */
    stopDelegatedHarvesting() {
        // Decrypt/generate private key and check it. Returned private key is contained into this.commonHarvesting
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.commonHarvesting, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            return;
        } else if (!CryptoHelpers.checkAddress(this.commonHarvesting.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            return;
        }
        // Generate remote data of the account
        CryptoHelpers.generateBIP32Data(this.commonHarvesting.privateKey, this.commonHarvesting.password, 0, this._Wallet.network).then((result) => {
                this._NetworkRequests.lockAccount(this.harvestingNode, result.privateKey).then((data) => {
                        if (data.status == 200) {
                            // Check node slots
                            this.checkNode();
                            // Update delegated data
                            this.updateDelegatedData();
                            // Clean data
                            this.clearSensitiveData();
                        }
                    },
                    (err) => {
                        console.error(err)
                        this._Alert.lockError(err.data.message);
                        return;
                    })
            },
            (err) => {
                this._$timeout(() => {
                    this._Alert.derivationFromSeedFailed(err);
                    return;
                }, 0);
            });
    }

    /**
     * updateDelegatedData() Update the delegated data and set chosen harvesting node if unlocked
     */
    updateDelegatedData() {
        this._NetworkRequests.getAccountData(this.harvestingNode, Address.toAddress(this._Wallet.currentAccount.child, this._Wallet.network)).then((data) => {
                this.delegatedData = data
                if (data.meta.status === "UNLOCKED") {
                    // Set harvesting node in local storage
                    this.setNodeInLocalStorage();
                }
            },
            (err) => {
                this._Alert.getAccountDataError(err.data.message);
                return;
            });
    }

    /**
     * clearSensitiveData() Reset the common objects
     */
    clearSensitiveData() {
        this.common = {
            'password': '',
            'privateKey': ''
        };
        this.commonDelegated = {
            'password': '',
            'privateKey': '',
            'delegatedPrivateKey': ''
        };
        this.commonHarvesting = {
            'password': '',
            'privateKey': ''
        }
    }

    /**
     * getNodeInLocalStorage() Get node from local storage if it exists
     */
    getNodeInLocalStorage() {
        if (this._Wallet.network == Network.data.Mainnet.id) {
            if (this._storage.harvestingMainnetNode) {
                this.harvestingNode = this._storage.harvestingMainnetNode;
            } 
        } else if (this._Wallet.network == Network.data.Testnet.id) {
            if (this._storage.harvestingTestnetNode) {
                this.harvestingNode = this._storage.harvestingTestnetNode;
            } 
        } else {
            if (this._storage.harvestingMijinNode) {
                this.harvestingNode = this._storage.harvestingMijinNode;
            }
        }
    }

    /**
     * setNodeInLocalStorage() Set harvesting node in local storage according to network
     */
    setNodeInLocalStorage() {
        if (this._Wallet.network == Network.data.Mainnet.id) {
            this._storage.harvestingMainnetNode = this.harvestingNode;
        } else if (this._Wallet.network == Network.data.Testnet.id) {
            this._storage.harvestingTestnetNode = this.harvestingNode;
        } else {
            this._storage.harvestingMijinNode = this.harvestingNode;
        }
    }

    /**
     * send() Build and broadcast the transaction to the network
     */
    send() {
        // Disable send button;
        this.okPressed = true;

        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, true)) {
            this._Alert.invalidPassword();
            // Enable send button
            this.okPressed = false;
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            // Enable send button
            this.okPressed = false;
            return;
        }

        // Build the entity to serialize
        let entity = this._Transactions.prepareImportanceTransfer(this.common, this.formData);
        // Construct transaction byte array, sign and broadcast it to the network
        return this._Transactions.serializeAndAnnounceTransaction(entity, this.common).then((res) => {
                // Check status
                if (res.status === 200) {
                    // If code >= 2, it's an error
                    if (res.data.code >= 2) {
                        this._Alert.transactionError(res.data.message);
                    } else {
                        this._Alert.transactionSuccess();
                    }
                }
                // Enable send button
                this.okPressed = false;
                // Delete private key in common
                this.common.privateKey = '';
            },
            (err) => {
                // Delete private key in common
                this.common.privateKey = '';
                // Enable send button
                this.okPressed = false;
                this._Alert.transactionError('Failed ' + err.data.error + " " + err.data.message);
            });
    }

}

export default ImportanceTransferCtrl;