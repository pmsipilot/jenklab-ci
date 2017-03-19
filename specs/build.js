'use strict';

const expect = require('expect.js');
const Build = require('../src/build');

describe('Build', () => {
    const job = 'job-name';
    const id = 42;
    let build;

    beforeEach(() => { build = new Build(job, id); });

    it('should be frozen', () => { expect(Object.isFrozen(build)).to.be(true); });
    it('should be sealed', () => { expect(Object.isSealed(build)).to.be(true); });
    it('should have a job property', () => { expect(build.job).to.be(job); });
    it('should have a build property', () => { expect(build.build).to.be(id); });
});
