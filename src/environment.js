'use strict';

class Environment {
    /**
     * @param {object} environment
     */
    constructor(environment) {
        Object.keys(environment)
            .filter(key => Environment.isAllowed(key))
            .forEach((key) => { this[key] = environment[key]; });

        Object.freeze(this);
        Object.seal(this);
    }

    /**
     * @param {string} name
     *
     * @returns {boolean}
     */
    static isAllowed(name) {
        for (let index = 0; index < Environment.whitelist.length; index += 1) {
            const allowed = Environment.whitelist[index];

            if ((allowed.exec && allowed.exec(name)) || allowed === name) {
                return true;
            }
        }

        return false;
    }
}

/**
 * @type {Array.<string | RegExp>}
 */
Environment.whitelist = [
    'GET_SOURCES_ATTEMPTS',
    'ARTIFACT_DOWNLOAD_ATTEMPTS',
    'RESTORE_CACHE_ATTEMPTS',
    /^CI$/,
    /^CI_/,
    /^GITLAB_/,
];

module.exports = Environment;
