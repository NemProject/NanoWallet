import nem from 'nem-sdk';
import Helpers from '../../utils/helpers';

class InvoiceCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, DataStore, $timeout) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._Wallet = Wallet;
        this._DataStore = DataStore;
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
        this.formData = nem.model.objects.create("transferTransaction")(this._Wallet.currentAccount.address);
        // No mosaics
        this.isMosaicTransfer = false;
        this.formData.mosaics = null;
        // No multisig
        this.formData.multisigAccount = '';
        // Prevent user to click twice on send when already processing
        this.okPressed = false;
        //
        // Character counter
        this.charactersLeft = 1024;
        // Object to contain our password & private key data
        this.common = nem.model.objects.get("common");
        // Store the prepared transaction
        this.preparedTransaction = {};
        // Update the fee in view
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

        // Set the message
        cleanTransferTransaction.message = this.formData.message;
        cleanTransferTransaction.messageType = 1;

        // No mosaics
        cleanTransferTransaction.mosaics = null;

        // Prepare
        let entity = nem.model.transactions.prepare("transferTransaction")(this.common, cleanTransferTransaction, this._Wallet.network);

        // Set the entity for fees in view
        this.preparedTransaction = entity;

        // Update the number of characters left in message
        this.charactersLeft = this.preparedTransaction.message.payload.length ? 1024 - (this.preparedTransaction.message.payload.length / 2) : 1024;

        // Return prepared transaction
        return entity;
    }


    //// End methods region ////

}

export default InvoiceCtrl;