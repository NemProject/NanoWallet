/**
 * Helper function to get the property value at path of object.
 *
 * @param object The object to query.
 * @param path   The path of the property to get.
 * @returns {*} The queried value if the path exists in the given object, otherwise undefined.
 */
const get = (object, path) => {
    return path.split('.').reduce ( (acc, prop) =>
        acc !== undefined && Object.hasOwnProperty.call(acc, prop) ? acc[prop] : undefined, object,
    );
};

/**
 * Helper function which allows to apply Chrome specific settings when running under nw.js.
 *
 * @param prop  The settings prop for which the settings should be applied. Must be passed as string.
 * @param value The value to apply to the given settings props.
 */
const applyChromeSetting = (prop, value) => {
    const settingsObject = get(chrome, prop);
    if (settingsObject === undefined) {
        console.info('Setting `chrome.' + prop + '` cannot be handled by this browser. This is the expected behavior ' +
            'if you don\'t run the standalone NEM Wallet!');
        return;
    }

    settingsObject.get({}, (details) => {
        if (details.levelOfControl === 'controllable_by_this_extension') {
            settingsObject.set({ value }, () => {
                if (chrome.runtime.lastError === undefined)
                    console.info('Successfully applied value `' + value + '` to setting `chrome.' + prop + '`');
                else
                    console.error('Couldn\'t apply value `' + value + '` to setting `chrome.' + prop + '`', chrome.runtime.lastError);
                });
        } else {
            console.info('Cannot control Chrome setting `chrome.' + prop + '`; LevelOfControl is: ' + details.levelOfControl);
        }
    });
};

/**
 * Applies the chrome.privacy settings.
 *
 * For an overview of all settings please visit the following site: https://developer.chrome.com/extensions/privacy
 */
const nwPrivacyConfig = () => {
    applyChromeSetting('privacy.services.alternateErrorPagesEnabled', false);
    applyChromeSetting('privacy.services.autofillEnabled', false);
    applyChromeSetting('privacy.services.hotwordSearchEnabled', false);
    applyChromeSetting('privacy.services.passwordSavingEnabled', false);
    applyChromeSetting('privacy.services.safeBrowsingExtendedReportingEnabled', false);
    applyChromeSetting('privacy.services.searchSuggestEnabled', false);
    applyChromeSetting('privacy.services.spellingServiceEnabled', false);
    applyChromeSetting('privacy.services.translationServiceEnabled', false);
};

/**
 * Applies the NW settings.
 */
const nwConfig = () => {
    nwPrivacyConfig();
};

export default nwConfig;