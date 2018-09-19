function AppRun(AppConstants, $rootScope, $timeout, Wallet, Alert, $transitions) {
    'ngInject';

    const publicStates = [
        "app.home",
        "app.login",
        "app.signup",
        "app.faq",
        "app.trezor",
        "app.offlineTransactionHome",
        "app.offlineTransactionCreate",
        "app.offlineTransactionSend",
        "app.importWalletQrCode"
    ];

     // Change page title based on state
    $transitions.onSuccess({ to: true }, (transition) => {
        // Scroll to top of the page
        window.scrollTo(0, 0);
        $rootScope.setPageTitle(transition.router.globals.current.title);
        // Enable tooltips globally
        $timeout( function() {
            $('[data-toggle="tooltip"]').tooltip()
        });     
    });

    // Check if a wallet is loaded before accessing private states
    $transitions.onStart({ 
        to: (state) => { 
            for (let i = 0; i < publicStates.length; i++) {
                if (publicStates[i] === state.name) return false;
            }
            return true;
        }
    }, (transition) => {
        if (!Wallet.current) {
            Alert.noWalletLoaded();
            return transition.router.stateService.target('app.home');
        }
    });

    // Helper method for setting the page's title
    $rootScope.setPageTitle = (title) => {
        $rootScope.pageTitle = '';
        if (title) {
            $rootScope.pageTitle += title;
            $rootScope.pageTitle += ' \u2014 ';
        }
        $rootScope.pageTitle += AppConstants.appName;
    };
}

export default AppRun;
