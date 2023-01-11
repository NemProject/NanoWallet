import WalletFixture from '../data/wallet';
import AccountDataFixture from '../data/accountData';

export const setupMainnetWallet = (Wallet, Nodes, DataBridge) => {
    Wallet.use(WalletFixture.mainnetWallet);
    Nodes.setDefault();
    DataBridge.accountData = AccountDataFixture.mainnetAccountData;
}

export const setupTestnetWallet = (Wallet, Nodes, DataBridge) => {
    Wallet.use(WalletFixture.testnetWallet);
    Nodes.setDefault();
    DataBridge.accountData = AccountDataFixture.testnetAccountData;
}

export const assertTestnetNodes = ($controller, $rootScope, controlName, Wallet, Nodes, DataBridge) => {
    // Arrange:
    setupTestnetWallet(Wallet, Nodes, DataBridge);

    const ctrl = $controller(controlName, {
        $scope: $rootScope.$new()
    });

    // Act:
    ctrl.setNodes();

    // Assert:
    expect(ctrl.nodes).toEqual([
        {
            "host": "http://hugetestalice.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://hugetestalice2.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://medalice2.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://localhost",
            "port": 7890
        }
    ]);
}

export const assertSuperNodes = async ($controller, $rootScope, controlName, Wallet, Nodes, DataBridge, SuperNodeProgram, $timeout) => {
    // Arrange:
    const expectedDTO = new Array(2).fill({
        "host": "http://localhost",
        "port": 7890
    });

    spyOn(SuperNodeProgram, 'getRandomNodes').and.returnValue(Promise.resolve(expectedDTO));

    setupMainnetWallet(Wallet, Nodes, DataBridge);

    const ctrl = $controller(controlName, {
        $scope: $rootScope.$new()
    });

    // Act:
    await ctrl.setNodes();
    $timeout.flush();

    // Assert:
    expect(ctrl.nodes).toEqual(expectedDTO);
}

export const assertMainnetNodes = async ($controller, $rootScope, controlName, Wallet, Nodes, DataBridge, SuperNodeProgram, $timeout) => {
    // Arrange:
    spyOn(SuperNodeProgram, 'getRandomNodes').and.returnValue(Promise.reject('error'));

    setupMainnetWallet(Wallet, Nodes, DataBridge);

    const ctrl = $controller(controlName, {
        $scope: $rootScope.$new()
    });

    // Act:
    await ctrl.setNodes();
    $timeout.flush();

    // Assert:
    expect(ctrl.nodes).toEqual([
        {
            "host": "http://hugealice.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://hugealice2.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://hugealice3.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://hugealice4.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://62.75.171.41",
            "port": 7890
        },
        {
            "host": "http://san.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://go.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://hachi.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://jusan.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://nijuichi.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://alice2.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://alice3.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://alice4.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://alice5.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://alice6.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://alice7.nem.ninja",
            "port": 7890
        },
        {
            "host": "http://localhost",
            "port": 7890
        }
    ]);
}
