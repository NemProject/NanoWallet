class PortalCtrl {
    constructor(Wallet, DataBridge, $location, Alert) {
        'ngInject';

        // Wallet service
        this._Wallet = Wallet;
        // DataBridge service
        this._DataBridge = DataBridge;
        // Alert service
        this._Alert = Alert;
        // $location to redirect
        this._location = $location;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }

    }

    /**
     * Fix a value to 4 decimals
     */
    toFixed4(value) {
        return value.toFixed(4);
    }


}

export default PortalCtrl;
