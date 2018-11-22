import Helpers from '../../src/app/utils/helpers';

describe('Helper versioning', function() {

    it("Simple version", function() {
        expect(Helpers.versionCompare("1.2.3", "1.2.2")>0).toBe(true);
        expect(Helpers.versionCompare("1.2.3", "1.3.1")<0).toBe(true);
        expect(Helpers.versionCompare("1.2.3", "2.1.1")<0).toBe(true);
        expect(Helpers.versionCompare("11.2.3", "5.2.2")>0).toBe(true);

        expect(Helpers.versionCompare("1.2.3", "1.2.3")==0).toBe(true);
        expect(Helpers.versionCompare("1.2.3", "1.2.3+other")==0).toBe(true);
        expect(Helpers.versionCompare("1.2.3", "1.2.3+other comment")==0).toBe(true);
        expect(Helpers.versionCompare("1.2.3", "1.2.3 comment")==0).toBe(true);

        expect(Helpers.versionCompare("1.2.3+meta", "1.2.3+other")==0).toBe(true);
        expect(Helpers.versionCompare("1.2.3+meta", "1.2.3")==0).toBe(true);
        expect(Helpers.versionCompare("1.2.3+meta", "1.2.3+other comment")==0).toBe(true);
        expect(Helpers.versionCompare("1.2.3+meta", "1.2.3 comment")==0).toBe(true);
    });
    it("Pre-release version parsing", function() {
        expect(Helpers.versionCompare("1.2.3-alpha", "1.2.3")<0).toBe(true);
        expect(Helpers.versionCompare("1.2.3", "1.2.3-alpha")>0).toBe(true);
        expect(Helpers.versionCompare("1.2.3-alpha+meta.1", "1.2.3")<0).toBe(true);
        expect(Helpers.versionCompare("1.2.3-alpha+meta.1 comment", "1.2.3")<0).toBe(true);
    });
});
