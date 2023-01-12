import nem from 'nem-sdk';

class ImportanceTransferCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($location, Wallet, Alert, $filter, DataStore, $timeout, AppConstants, $localStorage, Nodes, SuperNodeProgram) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._location = $location;
        this._Wallet = Wallet;
        this._$filter = $filter;
        this._DataStore = DataStore;
        this._$timeout = $timeout;
        this._storage = $localStorage;
        this._Nodes = Nodes;
        this._superNodeProgram = SuperNodeProgram;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        // Form is an importance transfer transaction object
        this.formData = nem.model.objects.create("importanceTransferTransaction")(this._Wallet.currentAccount.child, 1);
        // Not using custom node by default
        this.isCustomNode = false;
        this.customHarvestingNode = "";
        // Get the harvesting endpoint from local storage or use default node
        this.harvestingNode = this._Nodes.getHarvestingEndpoint();
        // No node slots by default
        this.hasFreeSlots = false;
        // Set the right nodes according to Wallet network
        this.setNodes();
        // Show supernodes by default on mainnet or hide <select>
        this.showSupernodes = this._Wallet.network !== nem.model.network.data.mainnet.id ? false : true;
        // Initial delegated account data
        this.delegatedData = this._DataStore.account.delegated.metaData;
        // Prevent user to click twice on send when already processing
        this.okPressed = false;
        // Object to contain our password & private key data for importance transfer.
        this.common = nem.model.objects.get("common");
        // Object to contain our password & private key data to reveal delegated private key.
        this.commonDelegated =  nem.model.objects.get("common");
        this.commonDelegated.delegatedPrivateKey = "";
        // Object to contain our password & private key data to start/stop harvesting.
        this.commonHarvesting = nem.model.objects.get("common");
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
        // Store the prepared transaction
        this.preparedTransaction = {};
        // Update fee
        this.prepareTransaction();
        // Check node slots
        this.checkNode();
        // Update delegated data
        this.updateDelegatedData();
        // Arrange for hardware wallets
        this.arrangeHW();
    }

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
            })
        }
    }

    /**
     * Create the remote for current account, if using hardware wallet
     */
    arrangeHW() {
        if ((this._Wallet.algo == "trezor" || this._Wallet.algo == "ledger") && !this._Wallet.currentAccount.child) {
            // Disable send button
            this.okPressed = true;

            this._Wallet.deriveRemote(this.common).then((res) => {
                this._$timeout(() => {
                    // Enable send button
                    this.okPressed = false;
                    this.formData.remoteAccount = this._Wallet.currentAccount.child;
                    this.prepareTransaction();
                }, 0)
            },
            (err) => {
                if (err === 'handledLedgerErrorSignal') {
                    return;
                } else {
                    this._$timeout(() => {
                        this._Alert.bip32GenerationFailed(err);
                         return;
                    }, 0);
                }
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
     * Prepare the transaction
     */
    prepareTransaction() {
        let entity = nem.model.transactions.prepare("importanceTransferTransaction")(this.common, this.formData, this._Wallet.network);
        // Store the prepared transaction
        this.preparedTransaction = entity;
        return entity;
    }

    /**
     * Update the remote account public key
     */
    updateRemoteAccount() {
        this.formData.remoteAccount = this.customKey ? '' : this._Wallet.currentAccount.child;
    }

    /**
     * Reveal the delegated private key
     */
    revealDelegatedPrivateKey() {
        // Get account private key or return
        if (!this._Wallet.decrypt(this.commonDelegated)) return this.okPressed = false;

        // Generate the bip32 seed for the new account
        this._Wallet.deriveRemote(this.commonDelegated).then((res) => {
            this._$timeout(() => {
                this.commonDelegated.delegatedPrivateKey = res.privateKey;
            }, 0)
        },
        (err) => {
            if (err === 'handledLedgerErrorSignal') {
                return;
            } else {
                this._$timeout(() => {
                    this._Alert.bip32GenerationFailed(err);
                    return;
                }, 0);
            }
        });
    }

    /**
     * Start delegated harvesting
     */
    startDelegatedHarvesting() {
        // Get account private key or return
        if (!this._Wallet.decrypt(this.commonHarvesting)) return this.okPressed = false;

        this._Wallet.deriveRemote(this.commonHarvesting).then((res) => {
            nem.com.requests.account.harvesting.start(this.harvestingNode, res.privateKey).then((data) => {
                this._$timeout(() => {
                    // Update delegated data
                    this.updateDelegatedData();
                    // Clean data
                    this.clearSensitiveData();
                });
            },
            (err) => {
                if (err === 'handledLedgerErrorSignal') {
                    return;
                } else {
                    this._$timeout(() => {
                        this._Alert.unlockError(err.data.message);
                        return;
                    });
                }
            });
        });
    }

    /**
     * Stop delegated harvesting
     */
    stopDelegatedHarvesting() {
        // Get account private key or return
        if (!this._Wallet.decrypt(this.commonHarvesting)) return this.okPressed = false;

        // Generate remote data of the account
        this._Wallet.deriveRemote(this.commonHarvesting).then((res) => {
            nem.com.requests.account.harvesting.stop(this.harvestingNode, res.privateKey).then((data) => {
                this._$timeout(() => {
                    // Check node slots
                    this.checkNode();
                    // Update delegated data
                    this.updateDelegatedData();
                    // Clean data
                    this.clearSensitiveData();
                });
            },
            (err) => {
                if (err === 'handledLedgerErrorSignal') {
                    return;
                } else {
                    this._$timeout(() => {
                        this._Alert.lockError(err.data.message);
                        return;
                    });
                }
            });
        });
    }

    /**
     * Update the delegated data and set chosen harvesting node if unlocked
     */
    updateDelegatedData() {
        if (this.isCustomNode) this.harvestingNode = this._Nodes.cleanEndpoint(this.customHarvestingNode);
        if (!this.harvestingNode) return;
        //
        nem.com.requests.account.data(this.harvestingNode, nem.model.address.toAddress(this._Wallet.currentAccount.child, this._Wallet.network)).then((data) => {
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
     * Reset the common objects
     */
    clearSensitiveData() {
        this.common = nem.model.objects.get("common");
        this.commonDelegated = nem.model.objects.get("common");
        this.commonDelegated.delegatedPrivateKey = "";
        this.commonHarvesting = nem.model.objects.get("common");
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
                // Reset all
                this.init();
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

export default ImportanceTransferCtrl;