'use strict';

const expect = require('expect.js');
const Queue = require('../src/queue');

describe('Queue', () => {
    const job = 'job-name';
    const id = 42;
    let queue;

    beforeEach(() => { queue = new Queue(job, id); });

    it('should be frozen', () => { expect(Object.isFrozen(queue)).to.be(true); });
    it('should be sealed', () => { expect(Object.isSealed(queue)).to.be(true); });
    it('should have a job property', () => { expect(queue.job).to.be(job); });
    it('should have a queue property', () => { expect(queue.queue).to.be(id); });
});
