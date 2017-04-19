const AppConstants = {
    //Application name
    appName: 'Nano Wallet',

    version: 'BETA 1.3.0',

    //Network
    defaultNetwork: 104,

    // Ports
    defaultNisPort: 7890,
    defaultMijinPort: 7895,
    defaultWebsocketPort: 7778,

    // Activate/Deactivate mainnet
    mainnetDisabled: false,

    // Activate/Deactivate mijin
    mijinDisabled: true,

    // Available languages
    languages: [{
        name: "English",
        key: "en"
    }, {
        name: "Chinese",
        key: "cn"
    }, {
        name: "Polish",
        key: "pl"
    }, {
        name: "Japanese",
        key: "jp"
    }, {
        name: "Spanish",
        key: "es"
    }]

};

export default AppConstants;