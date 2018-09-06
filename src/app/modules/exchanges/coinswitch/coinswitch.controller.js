class CoinSwitchCtrl {

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

        // Open the ShapeShift widget in a new window
        let child = window.open("https://coinswitch.co/widget?widget_id=313393f2&from=btc&to=xem&amount=0.1&block_extra_data=true&address=" + this._Wallet.currentAccount.address,'1418115287605','width=700,height=500,toolbar=0,menubar=0,location=0,status=1,scrollbars=1,resizable=0,left=0,top=0,noopener=1');
    	child.opener = null;
    }

}

export default CoinSwitchCtrl;