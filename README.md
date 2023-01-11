# NEM Wallet #

### How to use the NEM Wallet ? ###

After downloading the latest version here https://forum.nem.io/t/nano-wallet-beta-1-1-11-5-000-xem-bug-bounty/2791, extract the NEM-Wallet folder from the archive, then you can simply click on start.html to open the app in your default browser. No installation or local server needed.

### How to import NCC wallet ? ###

Open NCC and your wallet, clicking on user icon should reveal a drop-down menu with "Export for Lightwallet".
Once your have your wallet (.json format), open the NEM Wallet and import the file from the login page. It'll ask for an upgrade and trigger the download of your updated wallet.
Do not delete your old NCC wallet and keep it safe somewhere.

### Imported accounts that are already harvesting using NCC ###

NCC is using a different way to generate the remote associated with an account. NEM Wallet uses BIP32 to generate it deterministically and make everything easier. In order to manage and monitor harvesting, you'll need to deactivate the old remote account from NCC and activate your new remote account from the NEM Wallet. Alternatively you can use a custom delegated public key in the NEM Wallet importance transaction page.

**/!\ Main network: Please note that if you are part of the Supernodes program you'll need to re-enroll your node using your new delegated public key.**

### How to update the NEM Wallet ? ###

Before update make sure that you don't have any wallets stored into the NEM-Wallet folder (you can place them anywhere you want). Then, just delete old version and unzip new version.

###  Dashboard is empty and no balance is showing ###

It is probably that the node you are connected to is down.
Look at the navigation bar, at the top of the page.
If the circle next to `Node` is red, click on it and select another node from the list.

### How to participate in the Supernodes program ? ###

To enroll Supernodes program, the minimum amount to participate at least **10,000 XEM** in the account.

The step is easy, login to the wallet, selected "Service" from the top menu, and search for `SuperNode Program`, then you will find a table at the bottom, and click on the "Enroll in Program" tab and fill up the form. Lastly, click on the enroll button. [More info](https://www.nem.io/supernode/).

# Developers #

### Node Requirement ###

Node.js v10

### Build from source ###

1) Install gulp

<pre>npm install -g gulp-cli</pre>

2) Open a console to the path of the NEM-Wallet folder and install all the needed dependencies

<pre>npm install</pre>

3) Build:

<pre>gulp</pre>

##### OR #####

4) Run the NEM Wallet as App (packaged with chromium browser)

<pre>npm run devApp</pre>

##### OR #####

5) Build NEM Wallet apps, default set to : win64,osx64,linux64

<pre>gulp build-app</pre>

6) For local use, build NEM Wallet Electron apps (only Electron verision support Ledger wallets), default build for MacOS, Windows and Linux

<pre>
# create the release folder where the artifacts will be created
mkdir -p release

# to skip code signing
export CSC_IDENTITY_AUTO_DISCOVERY=false

npm run release
</pre>

7) Release for distribution: (Code signing for Apple builds - requires `Developer ID Certificate`)

    7.1 On a MacOS machine, download the zip file containing the app signing certificates (ask team)

    7.2 Extract the certificates and double click each one of them to add to the keychain (ask the team for private key password)

    7.3 Starting with MacOS 10.14.5, all signed applications by new `Developer ID Certificate` will need to be notarized. This is an automated step in the process. You'll need to enable notarization by setting the following env vars.

    <pre>
    export DESKTOP_APP_NOTARIZE=true
    export DESKTOP_APP_APPLE_ID=VALID_APPLE_DEV_ID
    export DESKTOP_APP_APPLE_PASSWORD=VALID_APPLE_DEV_PASSWORD
    </pre>

    7.4 Enable auto discovery for code signing process to pick up the certificates from the keychain

    <pre>export CSC_IDENTITY_AUTO_DISCOVERY=true</pre>

    7.5 Run release
    <pre>npm run release</pre>

    7.6 Validate if the app is signed with a `Developer ID Certificate` and notarized

    <pre>spctl -a -t exec -v ./release/mac/Nem\ Wallet.app
    # Output(Success): ./release/mac/Nem Wallet.app: accepted source=Notarized Developer ID
    # Output(Failure): ./release/mac/Nem Wallet.app: rejected source=Unnotarized Developer ID
    </pre>

### Known issues ###

- Sometimes, depending the node used, unconfirmed data to sign is not incoming from websocket
