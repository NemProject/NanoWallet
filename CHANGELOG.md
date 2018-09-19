# Changelog

## Version 2.3.2

    - Fix DNS search
    - Update languages
    - Minor improvements

## Version 2.3.0

    - Domain Name System module
    - Import Wallet QR code module
    - Support voting with Trezor
    - Minor fixes and improvements

## Version 2.2.0

    - Create and verify signed messages modules
    - Account transactions explorer
    - Fix timestamp too far in the future
    - Updated voting backend
    - Minor fixes and improvements

## Version 2.1.2
    
    - Voting modules
    - Offline transaction modules
    - Advanced Apostille
    - BIP32 refactor
    - News and transaction confirmation components (WIP)
    - Invoice module and component
    - Minor fixes and improvements

## Version 2.0.14
    
    - Fix brain wallet login

## Version 2.0.13
    
    - Hide Trezor login button in Chrome builds

## Version 2.0.12
    
    - Fix harvesting on mainnet
    - Fix new update notification

## Version 2.0.10
    
    - Fix Trezor support
    - Minor fixes and improvements

## Version 2.0.2

    - Fix password input showing if using Trezor
    - Shows encryption fee message in fee input

## Version 2.0.0

    - Use the [nem-sdk](https://github.com/QuantumMechanics/NEM-sdk)
    - Trezor support
    - ShapeShift support
    - Step by step signup and account safety protocol
    - Extra entropy added to simple wallets
    - Added FAQ
    - Can show balance and market data in different currencies
    - Notification on homepage when new update available

## Version 1.4.13

    - Allow sub-namespaces and mosaic names to start with a number
    - Fix secondary accounts: In **occasional** cases, secondary accounts private keys can start with '00' but BIP32 was omitting it, giving a 62 characters private key. Those **secondary accounts** will fail to send anything out even if password is valid (but recoverable).
    - Update languages

## Version 1.4.10

    - New fee structure on Mainnet
    - Added passphrase strength estimator to brain wallet: https://github.com/dropbox/zxcvbn
    - Brain wallet passphrase requires 40 characters minimum
    - Moved purge button into footer
    - Show an alert asking to change node if not connected within 5 seconds after login
    - Show an alert if user's brain wallet seems weak (< 40 characters)
    - Minor fixes and improvements

## Version 1.4.3

    - Voting module on Mainnet
    - Removed bob.nem.ninja and used MedAlice2 as default testnet node
    - Minor fixes and improvements

## Version 1.4.0

    - New fee structure (on testnet)
    - Voting module (on testnet), made by @shierve https://github.com/shierve
    - If user deny geoloc for nearest node, app will select a random supernode
    - Fixed languages
    - Minor fixes and improvements

## Version 1.3.12

    - Improve start / stop delegated harvesting design
    - Fix market data percentage change
    - Allow only one cosignatory removal per multisig edit
    - Prevent multisig edit to make a 0 of m (= m of m)
    - Module to sign multisig transactions if not pushed into your unconfirmed transactions
    - Fetch the closest node from user location (https://www.w3schools.com/html/html5_geolocation.asp26)
    - Minor fixes and improvements

## Version 1.3.4

    - New account safety measures at wallet creation
    - Transaction details and multisignature dropdowns shows account label if present in address book
    - Selected language stored in local storage
    - Russian translation
    - Minor fixes & improvements

## Version 1.3.0

    - New design
    - Address book
    - Fix Apostille on Chrome and Safari
    - No need to provide an account address to create a private key wallet, address will be shown automatically
    - Same as above point but for creating multisig accounts
    - Importance transaction module show the corresponding remote account address when a custom public key is provided
    - Fix handling of decimal amount in normal transfer transaction, comma and dot decimal mark can be used
    - Fix message fee
    - Fix 'unknown mosaic divisibility' error when receiving a new mosaic
    - Limit individual apostille file to 100MB
    - Fix display of importance score
    - Fix "FAILURE_TIMESTAMP_TOO_FAR_IN_FUTURE" using NIS time-sync API
    - Lock app and show message if browser not supported
    - New market data provider
    - Minor fixes & improvements

## Version 1.2.12

    - Renew namespace module
    - Renewal alert when namespaces can be renewed (one month before expiry)
    - Fix multisignature module
    - No need to send at least one transaction from an account before converting it to multisig, just send funds to it and convert.
    - Fix apostille request message QR
    - Clean apostilles explorer table to show only HEX messages
    - Fix Balance and vested balance display (dot instead of comma)
    - Fix notarization account cleared when uploading a file in update apostille
    - Fix create apostille still on public after selecting multisig
    - Smaller apostille certificate size
    - Minor design

## Version 1.2.2

    - Namespaces & Mosaics explorer
	- Accounts explorer
	- QR to export an account to android & Ios
	- New Apostille certificate
	- Nty data separated by network in local storage
	- Apostilles are private by default
	- User's Apostille history moved in service page
	- Ring on confirmed and unconfirmed transactions (Same as lightwallet)
	- Japanese and Polish translations
	- Switch for mainnet fee fork
	- Improved comments of Utils and Services for jsDoc
	- Minor fixes and design


## Version 1.1.11

    - Global code improvements: Faster and stabler
    - Fix upgrade of NCC wallets
    - Improve signature of multisig txes
    - Improve transaction details
    - Fix aliases with special chars
    - New apostille certificate design
    - Apostille improvements
    - Better handling of nodes for harvesting
    - Multisignature accounts delegated harvesting
    - Store all nodes used for multisignature accounts delegated harvesting in local storage
    - Automatically reconnect if your internet connection goes down
    - Mainnet enabled
    - Chinese translation (about 95% done)
    - Minor design
    - Minor fixes


## Version 1.1.3

    - Ready for translators (Full i18n)
    - Can sign multisignature aggregate modifications, namespace provision, mosaic definition and mosaic supply changes transactions.
    - Improvements on apostille HD accounts
    - Apostille certificates
    - Apostille explorer
    - Custom text apostilles
    - Balance of selected mosaic in transfer module
    - Changelly Instant Exchange module (Thanks to @ReverseCold)
    - Accounts label
    - Improved custom node handling
    - Improved all transaction types details design and data
    - Loading screen for computationnally intensive operations
    - Fix messages with unicode
    - Fix messages with carriage return and keep the formatting in transaction details
    - Fix harvesting with child accounts
    - FAQ module
    - Minor fixes
    - Minor design

## Version 1.0.13

    - Fix message fees (lower)
    - Fix private apostilles
    - Fix audit of private apostilles
    - Minor design

## Version 1.0.10

    - Fix simple signature changes in edit multisignature contracts.
    - Fix decryption of message for sender.
    - Fix autodetection of remote account status (locked or unlocked) on harvesting node change.
    - Better validation in namespace and mosaic modules.
    - Add extra information about operations
    - Minor design
