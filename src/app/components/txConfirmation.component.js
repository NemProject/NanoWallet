import nem from "nem-sdk";

class TxConfirmationCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, $scope) {
        'ngInject';

        // Initialize when component is ready
        this.$onInit = () => {

            //// Component dependencies region ////

            this._Wallet = Wallet;

            //// End dependencies region ////

            //// Component properties region ///

            //// End properties region ////
        }

    }

    //// Component methods region ////

    

    //// End methods region ////

}

// TxConfirmation config
let TxConfirmation = {
    controller: TxConfirmationCtrl,
    templateUrl: 'layout/partials/txConfirmation.html',
    bindings: {
        tx: '=tx'
    }
};

export default TxConfirmation;