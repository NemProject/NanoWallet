import nem from 'nem-sdk';

class SignedMessageCreationCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, $timeout) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._Wallet = Wallet;
        this._$timeout = $timeout;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        this.okPressed = false;
        // Object to contain our password & private key data
        this.common = nem.model.objects.get("common");
        this.message = "";
        this.signedMessage = "";
    }

    /**
     * Copy the signed message to clipboard
     */
    copyMessage() {
        if(!this.signedMessage) return;
        let dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "dummy_id");
        dummy.setAttribute('value', this.signedMessage);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        this._Alert.signedMsgCopySuccess();
    }

    /**
     * Create the signed message
     */
    sign() {
        // Disable verify button
        this.okPressed = true;

        if (!this.message) return this.okPressed = false;

        // Get account private key
        if (!this._Wallet.decrypt(this.common)) return this.okPressed = false;

        let message = nem.utils.convert.utf8ToHex(this.message.toString());

        // Create a key pair object from private key
        let kp = nem.crypto.keyPair.create(nem.utils.helpers.fixPrivateKey(this.common.privateKey));

        // Sign the message with keypair object
        let signature = kp.sign(message);

        this.signedMessage = JSON.stringify({
            'message': message,
            'signer': kp.publicKey.toString(),
            'signature': signature.toString()
        });

        this.okPressed = false;
    }

    //// End methods region ////

}

export default SignedMessageCreationCtrl;