import nem from 'nem-sdk';
import Helpers from '../../../utils/helpers';

class OfflineTransactionCreateCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, DataStore, $state, $timeout, $localStorage, AddressBook) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._Wallet = Wallet;
        this._DataStore = DataStore;
        this._$state = $state;
        this._$timeout = $timeout;
        this._Helpers = Helpers;
        this._storage = $localStorage;
        this._AddressBook = AddressBook;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        // Show warning if connection detected
        if (navigator.onLine) $('#connectionWarning').modal('show');
        // Get wallets from local storage or set an empty array
        this._storage.wallets = this._storage.wallets || [];
        if (this._storage.wallets.length) {
            //
            this.selectedWallet = this._storage.wallets[0];
            this.setAccount();
            this.setContacts();
            // Form is a transfer transaction object, pre-set recipient if any from state parameter
            this.formData = nem.model.objects.get("transferTransaction");
            // Mosaics are null by default
            this.formData.mosaics = null;
            // Set first multisig account if any
            this.formData.multisigAccount = '';
            // Switch between mosaic transfer and normal transfers
            this.isMosaicTransfer = false;
            // Prevent user to click twice on send when already processing
            this.okPressed = false;
            // Character counter
            this.charactersLeft = 1024;
            // Object to contain our password & private key data
            this.common = nem.model.objects.get("common");
            // Store the prepared transaction
            this.preparedTransaction = {};
            //
            this.resultSafeTransaction = "";
            // Update the fee in view
            this.prepareTransaction();
        }
    }

    /**
     * Show / Hide address book <select>
     */
    showHideAddressBook() {
        this.showContacts = this.showContacts ? this.showContacts = false : this.showContacts = true;
    }

    setContacts() {
        this.contacts = this._AddressBook.getContacts(this.selectedWallet);
    }

    setAccount() {
        this.selectedAccount = this.selectedWallet.accounts[0];
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

        // If user selected encrypted message
        if(this.formData.messageType === 2) {
            this._Alert.noEncryptedMessageOffline();
            this.formData.messageType = 1;
        }

        // Set recipient public key
        cleanTransferTransaction.recipientPublicKey = this.formData.recipientPublicKey;

        // Set the message
        cleanTransferTransaction.message = this.formData.message;
        cleanTransferTransaction.messageType = this.formData.messageType;

        // Prepare transaction object according to transfer type
        cleanTransferTransaction.mosaics = null;
        // Prepare
        let entity = nem.model.transactions.prepare("transferTransaction")(this.common, cleanTransferTransaction, this.selectedWallet.accounts[0].network);

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
     * Copy the signed transaction to clipboard
     */
    copyTransaction() {
        if(!this.resultSafeTransaction) return;
        let dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "dummy_id");
        dummy.setAttribute('value', this.resultSafeTransaction);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        this._Alert.signedTxCopySuccess();
    }

    /**
     * Generate a transaction QR
     */
    generateTransactionQR() {
        // Account info model for QR
        let code = kjua({
            size: 300,
            text: this.resultSafeTransaction,
            fill: '#000',
            quiet: 0,
            ratio: 2,
            ecLevel: 'L'
        });
        $('#signedTransactionQR').html("");
        $('#signedTransactionQR').append(code);
        return;
}

    /**
     * Create the signed transaction
     */
    create() {
        // Disable send button
        this.okPressed = true;

        // Get account private key for preparation or return
        let primary = this.selectedWallet.accounts[0];
        if (!this._Wallet.decrypt(this.common, this.selectedAccount, primary.algo, primary.network)) return this.okPressed = false;

        // Prepare the transaction
        let entity = this.prepareTransaction();

        // Sending will be blocked if recipient is an exchange and no message set
        if (!this._Helpers.isValidForExchanges(entity)) {
            this.okPressed = false;
            this._Alert.exchangeNeedsMessage();
            return;
        }

        // Create a key pair object from private key
        let kp = nem.crypto.keyPair.create(nem.utils.helpers.fixPrivateKey(this.common.privateKey));

        // Serialize the transaction
        let serialized = nem.utils.serialization.serializeTransaction(entity);

        // Sign the serialized transaction with keypair object
        let signature = kp.sign(serialized);

        // Build the object to send
        this.resultSafeTransaction = JSON.stringify({
            'data': nem.utils.convert.ua2hex(serialized),
            'signature': signature.toString()
        });

        this.generateTransactionQR();

        this.okPressed = false;
    }

    //// End methods region ////

}

export default OfflineTransactionCreateCtrl;