import Helpers from '../../src/app/utils/helpers';

describe('Helper versioning', function() {

    function testVersions(first, second, result) {
        it("Version " + first + " minus " + second + " is " + result, function() {
            expect(Math.sign(Helpers.versionCompare(first, second)) == result).toBe(true);
        })  
    };

    // simple tests to make sure parsing works
    testVersions("1.2.3", "1.2.2", 1);
    testVersions("1.2.3", "1.2.2", 1);
    testVersions("1.2.3", "1.3.1", -1);
    testVersions("1.2.3", "2.1.1", -1);
    testVersions("11.2.3", "5.2.2", 1);
    testVersions("1.2.3", "1.2.3", 0);
    testVersions("1.2.3", "1.2.3+other", 0);
    testVersions("1.2.3", "1.2.3+other comment", 0);
    testVersions("1.2.3", "1.2.3 comment", 0);
    // couple of metadata tests
    testVersions("1.2.3+meta", "1.2.3+other", 0);
    testVersions("1.2.3+meta", "1.2.3", 0);
    testVersions("1.2.3+meta", "1.2.3+other comment", 0);
    testVersions("1.2.3+meta", "1.2.3 comment", 0);
    testVersions("1.2.3-alpha", "1.2.3", -1);
    // prerelease tests
    testVersions("1.2.3", "1.2.3-alpha", 1);
    testVersions("1.2.3-alpha+meta.1", "1.2.3", -1);
    testVersions("1.2.3-alpha+meta.1 comment", "1.2.3", -1);
    //// following tests represent examples from the semver page
    // basic major, minor, patch
    testVersions("1.0.0", "2.0.0", -1);
    testVersions("2.0.0", "2.1.0", -1);
    testVersions("2.1.0", "2.1.1", -1);
    // prerelease tests
    testVersions("1.0.0-alpha", "1.0.0-alpha.1", -1);
    testVersions("1.0.0-alpha.1", "1.0.0-alpha.beta", -1);
    testVersions("1.0.0-alpha.beta", "1.0.0-beta", -1);
    testVersions("1.0.0-beta", "1.0.0-beta.2", -1);
    testVersions("1.0.0-beta.2", "1.0.0-beta.11", -1);
    testVersions("1.0.0-beta.11", "1.0.0-rc.1", -1);
    testVersions("1.0.0-rc.1", "1.0.0", -1);
    // reversed prerelease tests
    testVersions("1.0.0-alpha.1", "1.0.0-alpha", 1);
    testVersions("1.0.0-alpha.beta", "1.0.0-alpha.1", 1);
    testVersions("1.0.0-beta", "1.0.0-alpha.beta", 1);
    testVersions("1.0.0-beta.2", "1.0.0-beta", 1);
    testVersions("1.0.0-beta.11", "1.0.0-beta.2", 1);
    testVersions("1.0.0-rc.1", "1.0.0-beta.11", 1);
    testVersions("1.0.0", "1.0.0-rc.1", 1);
});
