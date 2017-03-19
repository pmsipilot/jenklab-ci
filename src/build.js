'use strict';

class Build {
    /**
     * @param {string} job
     * @param {number} build
     */
    constructor(job, build) {
        this.job = job;
        this.build = build;

        Object.freeze(this);
        Object.seal(this);
    }
}

module.exports = Build;
