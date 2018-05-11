import nem from 'nem-sdk';

class AccountCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, $location, Alert, Wallet, DataStore, $timeout, DataBridge, Trezor) {
        'ngInject';

        //// Module dependencies region ////

        this._Wallet = Wallet;
        this._location = $location;
        this._storage = $localStorage;
        this._Alert = Alert;
        this._DataStore = DataStore;
        this._$timeout = $timeout;
        this._DataBridge = DataBridge;
        this._Trezor = Trezor;

        //// End dependencies region ////

        //// Module properties region ////

        // Store the selected wallet
        this.selectedWallet = undefined;

         // Show / Hide account selection depending of number of accounts
        this.showAccounts = false;
        
        // Store the label for new account
        this.newAccountLabel = "";

        // Show the password input for mobile wallet QR
        this.showMobileQRPass = true;

        // Common object to contain our password & private key data for adding account
        this.common = nem.model.objects.get("common");

        // Common object to contain our password & private key data for reveal
        this.commonPK = nem.model.objects.get("common");

        // Common object to contain our password & private key data for QR wallet
        this.commonQR = nem.model.objects.get("common");

        // Prevent users to click twice on button when already processing
        this.okPressed = false;

        //// End properties region ////

        // Generate the account info QR
        this.generateAccountInfoQR();

        // Check number of accounts in wallet to show account selection in view
        this.checkNumberOfAccounts();
    }

    //// Module methods region ////

    /**
     * Generate the account info QR
     */
    generateAccountInfoQR() {
        // Account info model for QR
        let QR = nem.model.objects.create("accountInfoQR")(this._Wallet.network === nem.model.network.data.testnet.id ? 1 : 2, 1, this._Wallet.currentAccount.address, this._Wallet.currentAccount.label);
        let code = kjua({
            size: 256,
            text: JSON.stringify(QR),
            fill: '#000',
            quiet: 0,
            ratio: 2,
        });
        $('#accountInfoQR').html("");
        $('#accountInfoQR').append(code);
        return;
    }

    /**
     * Generate the mobile wallet QR
     */
    generateWalletQR() {
        let QR = this._Wallet.generateQR(this.commonQR);
        if(QR) {
            $('#mobileWalletQR').html("");
            $('#mobileWalletQR').append(QR);
            // Hide the password input for export to mobile qr
            this.showMobileQRPass = false;
        }
        this.reset();
        return;
    }

    /**
     * Reveal the private key
     */
    showPrivateKey() {
        // Get private key
        if (!this._Wallet.decrypt(this.commonPK)) this.reset();
        return;
    }

    /**
     * Change current account
     *
     * @param {number} accountIndex - The account index in the wallet.accounts object
     */
    changeCurrentAccount(accountIndex) {
        // Close the connector
        this._DataBridge.connector.close()
        this._DataStore.connection.status = false;
        // Reset DataBridge service properties
        this._DataBridge.reset();
        // Set the selected account
        this._Wallet.useAccount(this._Wallet.current, accountIndex);
        // Change endpoint port to websocket port
        let endpoint = nem.model.objects.create("endpoint")(this._Wallet.node.host, nem.model.nodes.websocketPort);
        // Create a connector
        let connector = nem.com.websockets.connector.create(endpoint, this._Wallet.currentAccount.address);
        // Open the connection with the connector
        this._DataBridge.openConnection(connector);
        // Redirect to dashboard
        this._location.path('/dashboard');
        return;
    }

    /**
     * Check the number of accounts in wallet
     */
    checkNumberOfAccounts() {
        if (Object.keys(this._Wallet.current.accounts).length > 1) {
            this.showAccounts = true;
        }
        return;
    }

    /**
     * Add a new bip32 account into the wallet
     */
    addNewAccount() {
        this.okPressed = true;
        return this._Wallet.addAccount(this.common, this.newAccountLabel).then((res) => {
            this._$timeout(() => {
                this.okPressed = false;
                this.checkNumberOfAccounts();
                // Hide modal
                $("#addAccountModal").modal('hide');
                this.reset();
                return;
            });
        }, 
        (err) => {
            this._$timeout(() => {
                this.okPressed = false;
                this.reset();
                return;
            });
        });
    }

    /**
     * Trigger download of wallet once prepared
     */
    downloadWallet() {
        if (this._Wallet.prepareDownload(this.selectedWallet)) {
            // Simulate click to trigger download
            document.getElementById("downloadWallet").click();
            return;
        }
    }

    /**
     * Copy the account address to clipboard
     */
    copyAddress() {
        var dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "dummy_id");
        dummy.setAttribute('value', this._Wallet.currentAccount.address);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        alert("Address copied!");
    }

    /**
     * Reset
     */
    reset() {
        this.common = nem.model.objects.get("common");
        this.commonPK = nem.model.objects.get("common");
        this.commonQR = nem.model.objects.get("common");
        this.newAccountLabel = "";
        return;
    }

    //// End methods region ////

}

export default AccountCtrl;