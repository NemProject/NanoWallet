import nem from 'nem-sdk';

class SignedMessageVerificationCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Alert, $timeout, Wallet) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._$timeout = $timeout;
        this._Wallet = Wallet;

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
        this.signedMessage = "";
        this.invalidObject = false;
    }

    /**
     * Verify signed message
     */
    verify() {
        this.okPressed = true;
        this.invalidObject = false;

        let signedMessage;

        try {
            signedMessage = JSON.parse(this.signedMessage);
        } catch (e) {
            this.result = {};
            this.invalidObject = true;
            return this.okPressed = false;
        }

        this.result = {
            "signer": signedMessage.signer,
            "message": nem.utils.format.hexMessage({"type": 1, "payload": signedMessage.message}),
            "signature": signedMessage.signature,
            "isValid": nem.crypto.verifySignature(signedMessage.signer, signedMessage.message, signedMessage.signature)
        }

        this.okPressed = false;
    }

    //// End methods region ////

}

export default SignedMessageVerificationCtrl;