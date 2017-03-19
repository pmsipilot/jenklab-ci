'use strict';

const expect = require('expect.js');
const Request = require('../src/request');

describe('Request', () => {
    const job = 'job-name';
    const parameters = {};
    let request;

    beforeEach(() => { request = new Request(job, parameters); });

    it('should be frozen', () => { expect(Object.isFrozen(request)).to.be(true); });
    it('should be sealed', () => { expect(Object.isSealed(request)).to.be(true); });
    it('should have a job property', () => { expect(request.job).to.be(job); });
    it('should have a parameters property', () => { expect(request.parameters).to.be(parameters); });
});
