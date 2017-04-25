'use strict';

class Parameter {
    /**
     *
     * @param {string} descriptor
     */
    constructor(descriptor) {
        const parts = descriptor.split('=');

        this.name = parts[0];
        this.value = parts.slice(1).join('=');
    }
}

module.exports = Parameter;
