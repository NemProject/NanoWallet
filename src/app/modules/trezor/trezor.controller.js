import nem from 'nem-sdk';

class TrezorCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(AppConstants, $timeout, Alert, Login, Trezor) {
        'ngInject';

        //// Module dependencies region ////

        this._AppConstants = AppConstants;
        this._$timeout = $timeout;
        this._Alert = Alert;
        this._Login = Login;
        this._Trezor = Trezor;

        //// End dependencies region ////

        //// Module properties region ////        
        /**
         * Default network
         *
         * @type {number}
         */
        this.network = this._AppConstants.defaultNetwork;

        /**
         * Available networks
         *
         * @type {object} - An object of objects
         */
        this.networks = nem.model.network.data;

        /**
         * Account
         *
         * @type {object}
         */
        this.account;

	/**
         * All accounts available
         *
         * @type {array of objects}
         */        
	this.accounts = [
	  {id:0,text:'#1'},
	  {id:1,text:'#2'},
	  {id:2,text:'#3'},
	  {id:3,text:'#4'},
	  {id:4,text:'#5'},
	  {id:5,text:'#6'},
	  {id:6,text:'#7'},
	  {id:7,text:'#8'},
	  {id:8,text:'#9'},
	  {id:9,text:'#10'}
	];
        
        //// End properties region ////
    }

    //// Module methods region ////

    /**
     * Change wallet network
     *
     * @param {number} id - The network id to use at wallet creation
     */
    changeNetwork(id) {
        if (id == nem.model.network.data.mijin.id && this._AppConstants.mijinDisabled) {
            this._Alert.mijinDisabled();
            // Reset network to default
            this.network = this._AppConstants.defaultNetwork;
            return;
        } else if (id == nem.model.network.data.mainnet.id && this._AppConstants.mainnetDisabled) {
            this._Alert.mainnetDisabled();
            // Reset network to default
            this.network = this._AppConstants.defaultNetwork;
            return;
        }
        // Set Network
        this.network = id;
    }

    /**
     * Change account
     *
     * @param {object}
     */
    changeAccount(account) {
        this.account = account;
    }
    
    /**
     * Login with TREZOR
     */
    login() {
        this._Trezor.createWallet(this.network, this.account.id, this.account.text).then((wallet) => {
            this._Login.login({}, wallet);
        }, (error) => {
            this._$timeout(() => {
                this._Alert.createWalletFailed(error);
            });
        });
    }


    //// End methods region ////

}

export default TrezorCtrl;
