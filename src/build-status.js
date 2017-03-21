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

    static isSuccessful(status) {
        return status === 'SUCCESS';
    }
}

BuildStatus.SUCCESS = 0;
BuildStatus.FAILURE = 1;

module.exports = BuildStatus;
