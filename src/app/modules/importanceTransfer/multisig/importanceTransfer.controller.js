import nem from 'nem-sdk';

class MultisigImportanceTransferCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, $filter, DataStore, $timeout, Nodes, SuperNodeProgram) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._Wallet = Wallet;
        this._$filter = $filter;
        this._DataStore = DataStore;
        this._$timeout = $timeout;
        this._Nodes = Nodes;
        this._superNodeProgram = SuperNodeProgram;

        //// End dependencies region ////

        //// Module properties region ////

        // Form is an importance transfer transaction object
        this.formData = nem.model.objects.create("importanceTransferTransaction")("", 1);

        // Remote account address for view
        this.remoteAccountAddress = '',
        // Remote account public key
        this.formData.remoteAccount = '';
        // For the public key in harvesting panel
        this.remoteAccountPublicView = '';
        // Multisig data
        this.formData.isMultisig = true;
        this.formData.multisigAccount = '';
        // Address generated from the custom public key
        this.customGeneratedRemote = '';

        // Prevent user to click twice on send when already processing
        this.okPressed = false;

        // Store multisig account data
        this.multisigData = '';

        // Object to contain our password & private key data.
        this.common = nem.model.objects.get("common");

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
        this.isCustomNode = false;
        this.customHarvestingNode = "";
        // Get the harvesting endpoint from local storage or use default node
        this.harvestingNode = this._Nodes.getHarvestingEndpoint();
        // Consider node has no free slots by default
        this.hasFreeSlots = false;
        // Set the right nodes according to Wallet network
        this.setNodes();
        // Show supernodes by default on mainnet
        this.showSupernodes = this._Wallet.network !== nem.model.network.data.mainnet.id ? false : true;;
        // Used to store the remote account data
        this.delegatedData;
        //
        this.remotePrivateKey;
        this.isActivator = false;

        // Store the prepared transaction
        this.preparedTransaction = {};

        //// End properties region ////

        // Check node slots
        this.checkNode();

        // Update fee
        this.prepareTransaction();

    }

    //// Module methods region ////

    /**
     * Set available nodes according to network
     */
    setNodes() {
        if(this._Wallet.network !== nem.model.network.data.mainnet.id) {
            this.nodes = this._Nodes.get();
        } else {
            this.nodes = [];
            this._superNodeProgram.getRandomNodes('active', 50).then((data) => {
                this._$timeout(() => {
                    this.nodes = data;
                });
            },
            (err) => {
                this._$timeout(() => {
                    this._Alert.supernodesError();
                    // Return default nodes
                    this.nodes = this._$filter('toEndpoint')(nem.model.nodes.mainnet);
                });
            });
        }
    }

    /**
     * Check node slots
     */
    checkNode() {
        this._Nodes.hasFreeSlots(this.isCustomNode ? this._Nodes.cleanEndpoint(this.customHarvestingNode) : this.harvestingNode).then((res) => {
            this._$timeout(() => {
                this.hasFreeSlots = res;
            });
        }, (err) => {
            this._$timeout(() => {
                this.hasFreeSlots = false;
            });
        });
    }

    /**
     * Update the delegated data and set chosen harvesting node if unlocked
     */
    updateDelegatedData() {
        if (this.isCustomNode) this.harvestingNode = this._Nodes.cleanEndpoint(this.customHarvestingNode);
        if (!this.harvestingNode) return;
        // Get account data
        nem.com.requests.account.data(this.harvestingNode, this.remoteAccountAddress).then((data) => {
            this._$timeout(() => {
                this.delegatedData = data
                if (data.meta.status === "UNLOCKED") {
                    // Set harvesting node in local storage
                    this._Nodes.saveHarvestingEndpoint(this.harvestingNode);
                }
            });
        },
        (err) => {
            this._$timeout(() => {
                this._Alert.getAccountDataError(err.data.message);
                return;
            });
        });
    }

    /**
     * Prepare the transaction
     */
    prepareTransaction() {
        let entity = nem.model.transactions.prepare("importanceTransferTransaction")(this.common, this.formData, this._Wallet.network);
        this.preparedTransaction = entity;
        return entity;
    }

    /**
     * Update the remote account public key
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
           this.customGeneratedRemote = nem.model.address.toAddress(this.formData.remoteAccount, this._Wallet.network);
        } else {
            this.customGeneratedRemote = '';
        }
    }

    /**
     * Generate data for selected multisig account
     */
    generateData() {
        // Get account private key for preparation or return
        if (!this._Wallet.decrypt(this.common)) {
            this.formData.multisigAccount = "";
            return;
        }

        if (!this.formData.multisigAccount) return this.reset();

        let kp = nem.crypto.keyPair.create(nem.utils.helpers.fixPrivateKey(this.common.privateKey));
        // Create remote account from signed sha256 hash of the multisig account address
        this.remotePrivateKey = nem.utils.helpers.fixPrivateKey(kp.sign(nem.crypto.js.SHA256(this.formData.multisigAccount.address).toString(nem.crypto.js.enc.Hex)).toString());
        let remoteKp = nem.crypto.keyPair.create(this.remotePrivateKey);
        this.remoteAccountAddress = nem.model.address.toAddress(remoteKp.publicKey.toString(), this._Wallet.network);
        this.formData.remoteAccount = remoteKp.publicKey.toString();
        this.remoteAccountPublicView = remoteKp.publicKey.toString();

        // Update fee
        this.prepareTransaction();

        // Get multisig account data
        nem.com.requests.account.data(this._Wallet.node, this.formData.multisigAccount.address).then((data) => {
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
        this.updateDelegatedData()
        this.checkRemoteAccount();

    }

    /**
    * Reset generated data
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
     * Start delegated harvesting, set chosen node in wallet service and local storage
     */
    startDelegatedHarvesting() {
        // Get account private key or return
        if (!this._Wallet.decrypt(this.common)) return;

        // Start harvesting
        nem.com.requests.account.harvesting.start(this.harvestingNode, this.remotePrivateKey).then((data) => {
            this._$timeout(() => {
                // Update delegated data
                this.updateDelegatedData();
                // Clean data
                this.common = nem.model.objects.get("common");
            });
        },
        (err) => {
            this._$timeout(() => {
                this._Alert.unlockError(err.data.message);
                return;
            });
        });
    }

    /**
     * Stop delegated harvesting
     */
    stopDelegatedHarvesting() {
        // Get account private key or return
        if (!this._Wallet.decrypt(this.common)) return;

        // Stop harvesting
        nem.com.requests.account.harvesting.stop(this.harvestingNode, this.remotePrivateKey).then((data) => {
            this._$timeout(() => {
                // Check node slots
                this.checkNode();
                // Update delegated data
                this.updateDelegatedData();
                // Clean data
                this.common = nem.model.objects.get("common");
            });
        },
        (err) => {
            this._$timeout(() => {
                this._Alert.lockError(err.data.message);
                return;
            });
        });
    }

    /**
     * Check if the generated remote account is the remote account of the multisig
     */
    checkRemoteAccount() {
        nem.com.requests.account.forwarded(this._Wallet.node, this.remoteAccountAddress).then((data) => {
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
                this._Alert.getAccountDataError(err.data.message);
            });
        });
    }

    /**
     * Reset data
     */
    resetData() {
        //this.formData = nem.model.objects.create("importanceTransferTransaction")("", 1);
        //this.formData.isMultisig = true;
        this.common = nem.model.objects.get("common");
        this.preparedTransaction = {};
        this.prepareTransaction();
    }

    /**
     * Prepare and broadcast the transaction to the network
     */
    send() {
        // Disable send button
        this.okPressed = true;

        // Get account private key for preparation or return
        if (!this._Wallet.decrypt(this.common)) return this.okPressed = false;

        // Build the entity to serialize
        let entity = this.prepareTransaction();

        // Use wallet service to serialize and send
        this._Wallet.transact(this.common, entity).then(() => {
            this._$timeout(() => {
                // Enable send button
                this.okPressed = false;
                // Reset form data
                this.resetData();
                return;
            });
        }, () => {
            this._$timeout(() => {
                // Delete private key in common
                this.common.privateKey = '';
                // Enable send button
                this.okPressed = false;
                return;
            });
        });
    }

    //// End methods region ////

}

export default MultisigImportanceTransferCtrl;