import CryptoHelpers from '../../../utils/CryptoHelpers';
import Address from '../../../utils/Address';
import KeyPair from '../../../utils/KeyPair';
import helpers from '../../../utils/helpers';
import Network from '../../../utils/Network';
import Nodes from '../../../utils/nodes';

class MultisigImportanceTransferCtrl {
    constructor($location, Wallet, Alert, Transactions, $filter, DataBridge, NetworkRequests, $timeout, $scope, AppConstants, $localStorage) {
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
        this.remoteAccountAddress = '',
        // Remote account public key
        this.formData.remoteAccount = '';
        // For the public key in harvesting panel
        this.remoteAccountPublicView = '';
        this.formData.mode = 1;
        this.formData.fee = 0;
        // Multisig data
        this.formData.innerFee = 0;
        this.formData.isMultisig = true;
        this.formData.multisigAccount = '';
        // Address generted from the custm public key
        this.customGeneratedRemote = '';

        // Needed to prevent user to click twice on send when already processing
        this.okPressed = false;

         // Needed to prevent getFreeNode endless loop
        this.freeNodeLooped = 0;

        //Hostname with free slots
        this.hostNameFreeSlots;

        //Set to show free host found
        this.freeHostFound=false;

        this.contacts = [];

        if(undefined !== this._storage.contacts && undefined !== this._storage.contacts[this._Wallet.currentAccount.address] && this._storage.contacts[this._Wallet.currentAccount.address].length) {
            this.contacts = this._storage.contacts[this._Wallet.currentAccount.address]
        }

        // To store multisig account data 
        this.multisigData = '';

        // Object to contain our password & private key data.
        this.common = {
            'password': '',
            'privateKey': '',
        };

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
        // Not using custom node by default
        this.customHarvestingNode = false;
        this.harvestingNode = helpers.getHostname(this._Wallet.node);
        // Consider node has no free slots by default
        this.noFreeSlots = true;
        // Array to contain nodes
        this.nodes = [];
        // Show supernodes by default on mainnet
        this.showSupernodes = true;
        // Used to store the remote account data
        this.delegatedData;
        //
        this.remotePrivateKey;
        this.isActivator = false;

        // Update fee
        this.updateFee();

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
     * updateDelegatedData() Update the delegated data
     */
    updateDelegatedData() {
        this._NetworkRequests.getAccountData(this.harvestingNode, this.remoteAccountAddress).then((data) => {
                this.delegatedData = data
                if (data.meta.status === "UNLOCKED") {
                    this.setNodeInLocalStorage();
                }
            },
            (err) => {
                this._Alert.getAccountDataError(err.data.message);
                return;
            });
    }

    /**
     * getNodeInLocalStorage() Get node from local storage if it exists
     */
    getNodeInLocalStorage() {
        if(this._Wallet.network === Network.data.Mainnet.id) {
            if (this._storage["multisigHarvestingMainnetNode-"+this.formData.multisigAccount.address]) {
                this.harvestingNode = this._storage["multisigHarvestingMainnetNode-"+this.formData.multisigAccount.address]
            }
        } else if (this._Wallet.network === Network.data.Testnet.id) {
            if (this._storage["multisigHarvestingTestnetNode-"+this.formData.multisigAccount.address]) {
                this.harvestingNode = this._storage["multisigHarvestingTestnetNode-"+this.formData.multisigAccount.address]
            }
        } else {
            if (this._storage["multisigHarvestingMijinNode-"+this.formData.multisigAccount.address]) {
                this.harvestingNode = this._storage["multisigHarvestingMijinode-"+this.formData.multisigAccount.address]
            }
        }
    }

    /**
     * setNodeInLocalStorage() Set the node in local storage
     */
    setNodeInLocalStorage() {
        if(this._Wallet.network === Network.data.Mainnet.id) {
            this._storage["multisigHarvestingMainnetNode-"+this.formData.multisigAccount.address] = this.harvestingNode;
        } else if (this._Wallet.network === Network.data.Testnet.id) {
            this._storage["multisigHarvestingTestnetNode-"+this.formData.multisigAccount.address] = this.harvestingNode;
        } else {
            this._storage["multisigHarvestingMijinode-"+this.formData.multisigAccount.address] = this.harvestingNode;
        }
    }

    /**
     * updateFee() Update transaction fee
     */
    updateFee() {
        let entity = this._Transactions.prepareImportanceTransfer(this.common, this.formData);
        this.formData.fee = entity.fee;
        this.formData.innerFee = entity.otherTrans.fee;

    }

    /**
     * updateRemoteAccount() Update the remote account public key
     */
    updateRemoteAccount() {
        if (this.customKey) {
            this.formData.remoteAccount = '';
            this.customGeneratedRemote = '';
        } else {
            this.generateData();
        }
    }

    /**
     * Generate address of the custom public key
     */
    generateAddress() {
        if(this.formData.remoteAccount.length === 64) {
           this.customGeneratedRemote = Address.toAddress(this.formData.remoteAccount, this._Wallet.network);
        } else {
            this.customGeneratedRemote = '';
        }
    }

    /**
     * generateData() Generate data for selected multisig account
     */
    generateData() {
        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            // Reset data
            this.reset();
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            // Reset data
            this.reset();
            return;
        }

        if (!this.formData.multisigAccount) {
            // Reset data
            this.reset();
            return;
        }

        let kp = KeyPair.create(helpers.fixPrivateKey(this.common.privateKey));
        // Create remote account from signed sha256 hash of the multisig account address
        this.remotePrivateKey = helpers.fixPrivateKey(kp.sign(CryptoJS.SHA256(this.formData.multisigAccount.address).toString(CryptoJS.enc.Hex)).toString());
        let remoteKp = KeyPair.create(this.remotePrivateKey);
        this.remoteAccountAddress = Address.toAddress(remoteKp.publicKey.toString(), this._Wallet.network);
        this.formData.remoteAccount = remoteKp.publicKey.toString();
        this.remoteAccountPublicView = remoteKp.publicKey.toString();

        // Update fee
        this.updateFee();

        // Get multisig account data
        this._NetworkRequests.getAccountData(helpers.getHostname(this._Wallet.node), this.formData.multisigAccount.address).then((data) => {
                this._$timeout(() => {
                    this.multisigData = data;
                });
            },
            (err) => {
                this._$timeout(() => {
                    this.multisigData = "";
                    this._Alert.getAccountDataError(err.data.message);
                });
            });

        this.getNodeInLocalStorage();
        this.checkNode();
        this.updateDelegatedData()
        this.checkRemoteAccount();

    }

    /**
    * reset() Reset generated data
    */
    reset() {
        this.remoteAccountAddress = '';
        this.formData.remoteAccount = '';
        this.remoteAccountPublicView = '';
        this.formData.multisigAccount = '';
        this.multisigData = '';
        this.delegatedData = '';
        this.remotePrivateKey = '';
        this.isActivator = false;
    }

    /**
     * startDelegatedHarvesting() Start delegated harvesting
     */
    startDelegatedHarvesting() {
            // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            return;
        }
            this._NetworkRequests.unlockAccount(this.harvestingNode, this.remotePrivateKey).then((data) => {
                if (data.status == 200) {
                    // Update delegated data
                    this.updateDelegatedData();
                    }
            },
            (err) => {
                console.error(err)
                this._Alert.unlockError(err.data.message);
                return;
            })
    }

    /**
     * stopDelegatedHarvesting() Stop delegated harvesting
     */
    stopDelegatedHarvesting() {
            // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            return;
        }
            this._NetworkRequests.lockAccount(this.harvestingNode, this.remotePrivateKey).then((data) => {
                if (data.status == 200) {
                    // Check node slots
                    this.checkNode();
                    // Update delegated data
                    this.updateDelegatedData();
                }
            },
            (err) => {
                console.error(err)
                this._Alert.unlockError(err.data.message);
                return;
            })
    }

    checkRemoteAccount() {
        // Get multisig account data
        return this._NetworkRequests.getForwarded(helpers.getHostname(this._Wallet.node), this.remoteAccountAddress).then((data) => {
                this._$timeout(() => {
                    if(data.account.address !== this.formData.multisigAccount.address) {
                        this.isActivator = false;
                    } else {
                        this.isActivator = true;
                    }
                });
            },
            (err) => {
                this._$timeout(() => {
                    console.log(err.data.message);
                });
            });
    }

    /**
     * send() Build and broadcast the transaction to the network
     */
    send() {
        // Disable send button;
        this.okPressed = true;

        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
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

export default MultisigImportanceTransferCtrl;