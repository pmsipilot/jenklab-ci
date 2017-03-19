'use strict';

class Request {
    /**
     * @param {string} job
     * @param {object} parameters
     */
    constructor(job, parameters) {
        this.job = job;
        this.parameters = parameters;

        Object.freeze(this);
        Object.seal(this);
    }
}

module.exports = Request;
