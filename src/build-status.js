'use strict';

class BuildStatus {
    /**
     * @param {string} job
     * @param {number} build
     * @param {number} status
     */
    constructor(job, build, status) {
        this.job = job;
        this.build = build;
        this.status = status;

        Object.freeze(this);
        Object.seal(this);
    }
}

module.exports = BuildStatus;
