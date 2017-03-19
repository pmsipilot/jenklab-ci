'use strict';

class Queue {
    /**
     * @param {string} job
     * @param {number} queue
     */
    constructor(job, queue) {
        this.job = job;
        this.queue = queue;

        Object.freeze(this);
        Object.seal(this);
    }
}

module.exports = Queue;
