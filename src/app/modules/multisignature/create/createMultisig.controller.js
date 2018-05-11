import nem from 'nem-sdk';

class CreateMultisigCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, Recipient, $timeout, $state) {
        'ngInject';

        //// Module dependencies region ////

        this._Wallet = Wallet;
        this._Alert = Alert;
        this._Recipient = Recipient;
        this._$timeout = $timeout;
        this._$state = $state;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        // Form is a multisig agregate modification transaction object
        this.formData = nem.model.objects.get("multisigAggregateModification");
        // Default relative change is 1 for creation
        this.formData.relativeChange = 1;
        // Cosignatory to add
        this.cosignatoryToAdd = '';
        // Cosignatory public key
        this.cosignatoryPubKey = '';
        // Account to convert empty by default
        this.accountToConvert = undefined;
        // Prevent user to click twice on send when already processing
        this.okPressed = false;
        // Store info about the multisig account to show balance
        this.multisigInfoData = undefined;
        // Object to contain our password & private key data
        this.common = nem.model.objects.get("common");
        // Modifications list pagination properties
        this.currentPage = 0;
        this.pageSize = 5;
        // Store the prepared transaction
        this.preparedTransaction = {};
        // Check number of accounts and arrange
        this.checkAccounts();
        // Update the fee in view
        this.prepareTransaction();
    }

    /**
     * If more than one account in wallet, we show a select element in view or a private key input otherwise
     */
    checkAccounts() {
        if (Object.keys(this._Wallet.current.accounts).length > 1) {
            this.haveMoreThanOneAccount = true;
            this.useCustomAccount = false;
        } else {
            this.haveMoreThanOneAccount = false;
            this.useCustomAccount = true;
        }
        // Set account if any passed in parameters
        if (this._$state.params.privateKey.length) {
            this.common.privateKey = this._$state.params.privateKey;
            this.useCustomAccount = true;
            this.generateAccountToConvert();
        }
    }

    /**
     * Generate the address of the account to convert from provided private key
     */
    generateAccountToConvert() {
        if (nem.utils.helpers.isHexadecimal(this.common.privateKey) && (this.common.privateKey.length === 64 || this.common.privateKey.length === 66)) {
            this.accountToConvert = nem.model.address.toAddress(nem.crypto.keyPair.create(this.common.privateKey).publicKey.toString(), this._Wallet.network);
            // Get account data of account to convert
            this.processMultisigInput();
        } else {
            this.accountToConvert = undefined;
        }
    }

    /**
     * Process multisig account input and get data from network
     */
    processMultisigInput() {
        if (!this.accountToConvert) return;
        // Reset recipient data
        this.resetMultisigData();
        //
        return this._Recipient.getAccount(this.useCustomAccount ? nem.model.address.clean(this.accountToConvert) : this.accountToConvert.address).then((res) => {
            this._$timeout(() => {
                //
                this.setMultisigData(res);
                return;
            });
        },
        (err) => {
            this._$timeout(() => {
                // Reset recipient data
                this.resetMultisigData();
                return;
            });
        });
    }

    /**
     * Set data received from Recipient service
     *
     * @param {object} data - An [AccountInfo]{@link http://bob.nem.ninja/docs/#accountInfo} object
     */
    setMultisigData(data) {
        if (data.meta.cosignatories.length) return this._Alert.alreadyMultisig();
        // Store data
        this.multisigInfoData = data.account;
        return;
    }

    /**
     * Reset data stored for multisig
     */
    resetMultisigData() {
        this.multisigInfoData = undefined;
        this.formData.modifications = [];
    }

    /**
     * Prepare the transaction
     */
    prepareTransaction() {
        let entity = nem.model.transactions.prepare("multisigAggregateModificationTransaction")(this.common, this.formData, this._Wallet.network);
        this.preparedTransaction = entity;
        return entity;
    }

    /**
     * Remove a cosignatory from the modifications list
     *
     * @param {array} array - A modification array
     * @param {object} elem - An object to remove from the array
     */
    removeCosignFromList(array, elem) {
        // If the deleted element is the elem 0 and length of array mod 5 gives 0 (means it is the last object of the page), 
        // we return a page behind unless it is page 1.
        if (array.indexOf(elem) === 0 && this.currentPage + 1 > 1 && (array.length - 1) % 5 === 0) {
            this.currentPage = this.currentPage - 1;
        }
        array.splice(array.indexOf(elem), 1);
        // Update the fee
        this.prepareTransaction();
    }

    /**
     * Add cosignatory to array
     */
    addCosig() {
        // Arrange
        let cleanMultisig = this.useCustomAccount ? nem.model.address.clean(this.accountToConvert) : nem.model.address.clean(this.accountToConvert.address);
        let cleanCosignatory = nem.model.address.clean(this.cosignatoryToAdd);
        // Cosignatory needs a public key
        if (!this.cosignatoryPubKey) return this._Alert.cosignatoryhasNoPubKey();
        // Multisig cannot be cosignatory
        if(cleanMultisig === cleanCosignatory) return this._Alert.multisigCannotBeCosignatory();
        // Check presence in modification array
        if (nem.utils.helpers.haveCosig(this.cosignatoryPubKey, this.formData.modifications)) {
            this._Alert.cosignatoryAlreadyPresentInList();
        } else {
            this.formData.modifications.push(nem.model.objects.create("multisigCosignatoryModification")(1, this.cosignatoryPubKey));
            this.prepareTransaction();
        }
    }

    /**
     * Build and broadcast the transaction to the network
     */
    send() {
        // Disable send button;
        this.okPressed = true;

        // If user use a custom account, private key is already in common no need to decrypt 
        if (this.useCustomAccount) {
            // Check if private key is correct
            if (!(nem.utils.helpers.isHexadecimal(this.common.privateKey) && (this.common.privateKey.length === 64 || this.common.privateKey.length === 66))) {
                // Enable send button
                this.okPressed = false;
                this._Alert.invalidPrivateKey();
                return;
            }
        } else {
            // Get account private key for preparation or return
            if (!this._Wallet.decrypt(this.common, this.accountToConvert)) return this.okPressed = false;
        }

        // Prepare the transaction
        let entity = this.prepareTransaction();

        // Use wallet service to serialize and send
        this._Wallet.transact(this.common, entity, this.accountToConvert).then(() => {
            this._$timeout(() => {
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

export default CreateMultisigCtrl;