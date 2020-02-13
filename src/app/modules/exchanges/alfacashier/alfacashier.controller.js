class AlfacashierCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet) {
        'ngInject';

        //// Module dependencies region ////

        this._Wallet = Wallet;

        //// End dependencies region ////

        // Open the ALFAcashier widget in a new window
        let child = window.open("https://widget.alfacashier.io/?from_currency=bitcoin&to_currency=nem&source_amount=0.1&address="+ this._Wallet.currentAccount.address +"&no_payment_id&rid=2f7a9357",'1418115287605','width=700,height=630,toolbar=0,menubar=0,location=0,status=1,scrollbars=1,resizable=0,left=0,top=0,noopener=1');
        child.opener = null;
    }

}

export default AlfacashierCtrl;
