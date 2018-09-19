import nem from 'nem-sdk';
import Helpers from '../../../utils/helpers';

class ExplorerTransactionsCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, Alert, $timeout, $http) {
        'ngInject';

        //// Module dependencies region ////

        this._Wallet = Wallet;
        this._Alert = Alert;
        this._$timeout = $timeout;
        this._$http = $http;
        this._Helpers = Helpers;

        //// End dependencies region ////

        //// Module properties region ////

        // Store transactions
        this.transactions = [];
        this.noMoreTxes = false;

        // Pagination properties
        this.currentPage = 0;
        this.pageSize = 10;

        //// End properties region ////

        // Get transactions
        this.getTransactions(false);
    }

    //// Module methods region ////

    /**
     * Get transactions of the account
     */
    getTransactions(isUpdate, txHash) {
        let endpoint;
        if (this._Wallet.network === nem.model.network.data.mainnet.id) {
            endpoint = nem.model.objects.create("endpoint")("http://hugealice.nem.ninja", 7890);
        } else {
            endpoint = this._Wallet.node;
        }
       let obj = {
            'params': {
                'address': this._Wallet.currentAccount.address,
                'hash': txHash ? txHash : '',
                'pageSize': isUpdate ? 100 : 50
            }
        };
        return this._$http.get(endpoint.host + ':' + endpoint.port + '/account/transfers/all', obj).then((res) => {
            if(isUpdate) {
                // Check if txes left to load
                if (!res.data.data.length || res.data.data.length < 100) this.noMoreTxes = true;
                //
                for (let i = 0; i < res.data.data.length; i++) {
                    this.transactions.push(res.data.data[i]);
                }
            } else {
                this.transactions = res.data.data;
            }
        });
    }

    //// End methods region ////
}

export default ExplorerTransactionsCtrl;