'use strict';

/**
 * @typedef {object} UrlDescriptor
 * @property {string} host
 * @property {number} port
 * @property {string} username
 * @property {string} token
 * @property {boolean} https
 */

class Url {
    /**
     * @param {UrlDescriptor} options
     */
    constructor(options) {
        if (!options.host) {
            throw new Error('Host parameter is required');
        }

        this.host = options.host;
        this.https = !!options.https;

        const port = parseInt(options.port, 10);

        if (options.port && isNaN(port)) {
            throw new Error('Invalid port parameter');
        }

        if (!!port) {
            this.port = port;
        }

        if ((options.username && !options.token) || (!options.username && options.token)) {
            throw new Error('Both username and token parameters are required');
        }

        this.username = options.username;
        this.token = options.token;
    }

    /**
     * @returns {string}
     */
    toString() {
        const scheme = `http${this.https ? 's' : ''}`;
        const authentication = this.username ? `${this.username}:${this.token}@` : '';
        const socket = `${this.host}${this.port ? `:${this.port}` : ''}`;

        return `${scheme}://${authentication}${socket}`;
    }
}

module.exports = Url;
