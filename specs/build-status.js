'use strict';

const expect = require('expect.js');
const BuildStatus = require('../src/build-status');

describe('BuildStatus', () => {
    const job = 'job-name';
    const build = 42;
    const value = 0;
    let status;

    beforeEach(() => { status = new BuildStatus(job, build, value); });

    it('should be frozen', () => { expect(Object.isFrozen(status)).to.be(true); });
    it('should be sealed', () => { expect(Object.isSealed(status)).to.be(true); });
    it('should have a job property', () => { expect(status.job).to.be(job); });
    it('should have a build property', () => { expect(status.build).to.be(build); });
    it('should have a status property', () => { expect(status.status).to.be(value); });
    it('should have a SUCCESS constant', () => { expect(BuildStatus).to.have.property('SUCCESS'); });
    it('should have a FAILURE constant', () => { expect(BuildStatus).to.have.property('FAILURE'); });

    it('should tell if it is a success status', () => {
        expect(BuildStatus.isSuccessful('SUCCESS')).to.be(true);
        expect(BuildStatus.isSuccessful('ABORTED')).to.be(false);
        expect(BuildStatus.isSuccessful('ANYTHING')).to.be(false);
    });
});
