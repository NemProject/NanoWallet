class NodeRewardsProgramCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, $filter, Wallet, DataStore) {
        'ngInject';

        //// Module dependencies region ////

        this._Wallet = Wallet;
        this._DataStore = DataStore;
        this._storage = $localStorage;
        this._filter = $filter;

        //// End dependencies region ////

        //// Component properties region ///

        this.selectedTab = 1;

         //// End properties region ///

        // Initialization
        this.init();
    }

    /**
     * Initialize module properties
     */
    init () {
        const { meta, account } = this._DataStore.account.metaData;
        const currentAccount = {
            label: account.address,
            value: account.address,
            balance: this.computeXEMBalance(account.balance)
        }

        if (meta.cosignatoryOf.length > 0) {
            const multisigAccounts = meta.cosignatoryOf.map(account => {
                return {
                    label: account.address + ' - Multisig',
                    value: account.address,
                    balance: this.computeXEMBalance(account.balance)
                }
            });

            this.accounts = [...multisigAccounts, currentAccount];

            this.selectedAccount = this.accounts[0];
            this.balance = this.accounts[0].balance;
        } else {
            this.selectedAccount = currentAccount.value;
            this.balance = currentAccount.balance;
        }

    }

    computeXEMBalance(absoluteBalance) {
        return this._filter("fmtNemValue")(absoluteBalance || 0)[0] + "." + this._filter("fmtNemValue")(absoluteBalance || 0)[1];
    }

    isTabSelected(tab) {
        return (this.selectedTab === tab);
    }

    setTab(tab) {
        this.selectedTab = tab;
    }

    onChangeAccount () {
        this.balance = this.selectedAccount.balance;
    }

}

export default NodeRewardsProgramCtrl;
