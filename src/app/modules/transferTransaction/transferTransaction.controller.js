import nem from 'nem-sdk';
import Helpers from '../../utils/helpers';

class TransferTransactionCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, DataStore, $state, $timeout) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._Wallet = Wallet;
        this._DataStore = DataStore;
        this._$state = $state;
        this._$timeout = $timeout;
        this._Helpers = Helpers;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        // Form is a transfer transaction object, pre-set recipient if any from state parameter
        this.formData = nem.model.objects.create("transferTransaction")(undefined !== this._$state.params.address ? this._$state.params.address : '');
        // Mosaics are null by default
        this.formData.mosaics = null;
        // Set first multisig account if any
        this.formData.multisigAccount = this._DataStore.account.metaData.meta.cosignatoryOf.length == 0 ? '' : this._DataStore.account.metaData.meta.cosignatoryOf[0];
        // Switch between mosaic transfer and normal transfers
        this.isMosaicTransfer = false;
        // Selected mosaic
        this.selectedMosaic = "nem:xem";
        // Mosaics data for current account
        this.currentAccountMosaicData = "";
        // Prevent user to click twice on send when already processing
        this.okPressed = false;
        // Character counter
        this.charactersLeft = 1024;
        // Object to contain our password & private key data
        this.common = nem.model.objects.get("common");
        // Store the prepared transaction
        this.preparedTransaction = {};
        // Update current account mosaics
        this.updateCurrentAccountMosaics();
        // Update the fee in view
        this.prepareTransaction();
    }

    /**
     * Set or unset data for mosaic transfer
     */
    setMosaicTransfer() {
        if (this.isMosaicTransfer) {
            this.formData.mosaics = [];
            // In case of mosaic transfer amount is used as multiplier,
            // set to 1 as default
            this.formData.amount = 1;
        } else {
            // Reset mosaics array
            this.formData.mosaics = null;
            // Reset amount
            this.formData.amount = 0;
        }
        this.prepareTransaction();
    }

    /**
     * Prepare the transaction
     */
    prepareTransaction() {
        // Create a new object to not affect the view
        let cleanTransferTransaction = nem.model.objects.get("transferTransaction");

        // Clean recipient
        cleanTransferTransaction.recipient = this.formData.recipient.toUpperCase().replace(/-/g, '');

        // Check entered amount
        if(!nem.utils.helpers.isTextAmountValid(this.formData.amount)) {
            return this._Alert.invalidAmount();
        } else {
            // Set cleaned amount
            cleanTransferTransaction.amount = nem.utils.helpers.cleanTextAmount(this.formData.amount);
        }

        // Set multisig, if selected
        if (this.formData.isMultisig) {
            cleanTransferTransaction.isMultisig = true;
            cleanTransferTransaction.multisigAccount = this.formData.multisigAccount;
        }

        // If user selected encrypted message but it is a multisig tx or the recipient has no public key, it reset to unencrypted
        if((this.formData.isMultisig || !this.formData.recipientPublicKey) && this.formData.messageType === 2) {
            if (this.formData.isMultisig) this._Alert.noEncryptionWithMultisig();
            else this._Alert.recipientHasNoPublicKey();
            this.formData.messageType = 1;
        }

        // Set recipient public key
        cleanTransferTransaction.recipientPublicKey = this.formData.recipientPublicKey;

        // Set the message
        cleanTransferTransaction.message = this.formData.message;
        cleanTransferTransaction.messageType = this.formData.messageType;

        // Prepare transaction object according to transfer type
        let entity;
        if(this.isMosaicTransfer) {
            // Set mosaics with cleaned amounts
            cleanTransferTransaction.mosaics = Helpers.cleanMosaicAmounts(this.formData.mosaics, this._DataStore.mosaic.metaData);
            // Prepare
            entity = nem.model.transactions.prepare("mosaicTransferTransaction")(this.common, cleanTransferTransaction, this._DataStore.mosaic.metaData, this._Wallet.network);
        } else {
            cleanTransferTransaction.mosaics = null;
            // Prepare
            entity = nem.model.transactions.prepare("transferTransaction")(this.common, cleanTransferTransaction, this._Wallet.network);
        }

        // Arrange message type if encrypted
        if(this.formData.messageType === 2) {
            if(this.formData.isMultisig) {
                entity.otherTrans.message.type = this.formData.messageType;
            } else {
                entity.message.type = this.formData.messageType;
            }
        }

        // Set the entity for fees in view
        this.preparedTransaction = entity;

        // Return prepared transaction
        return entity;
    }

    /**
     * Get current account mosaics names
     */
    updateCurrentAccountMosaics() {
        // Reset mosaics
        this.setMosaicTransfer();
        // Get current account
        let acct = this.formData.isMultisig ? this.formData.multisigAccount.address : this._Wallet.currentAccount.address;
        // Set current account mosaics names and data, if account owns any
        this.currentAccountMosaicData = undefined !== this._DataStore.mosaic.ownedBy[acct] ? this._DataStore.mosaic.ownedBy[acct]: "";
        // Default selected is nem:xem
        this.selectedMosaic = "nem:xem";
        return;
    }

    /**
     * Prepare and broadcast the transaction to the network
     */
    send() {
        // Disable send button
        this.okPressed = true;

        // Get account private key for preparation or return
        if (!this._Wallet.decrypt(this.common)) return this.okPressed = false;

        // Prepare the transaction
        let entity = this.prepareTransaction();

        // Sending will be blocked if recipient is an exchange and no message set
        if (!this._Helpers.isValidForExchanges(entity)) {
            this.okPressed = false;
            this._Alert.exchangeNeedsMessage();
            return;
        }

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
        /*$('#confirmation').modal({
            show: 'true'
        });*/ 
    }

    //// End methods region ////

}

export default TransferTransactionCtrl;