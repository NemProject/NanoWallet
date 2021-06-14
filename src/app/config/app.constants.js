const AppConstants = {
    //Application name
    appName: 'NEM Wallet',

    version: '2.6.1',

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
        name: "German",
        key: "de"
    }, {
        name: "Japanese",
        key: "jp"
    }, {
        name: "Русский",
        key: "ru"
    }, {
        name: "Nederlands",
        key: "nl"
    }, {
        name: "Hrvatski",
        key: "hr"
    }/*, {
        name: "Français",
        key: "fr"
    }*/],

};

export default AppConstants;
