'use strict';

const expect = require('expect.js');
const Environment = require('../src/environment');

describe('Environment', () => {
    let environment;

    beforeEach(() => { environment = new Environment({}); });

    it('should be frozen', () => { expect(Object.isFrozen(environment)).to.be(true); });
    it('should be sealed', () => { expect(Object.isSealed(environment)).to.be(true); });

    describe('Custom environment', () => {
        beforeEach(() => { environment = new Environment(process.env); });

        it('should reject unknown environment variable', () => {
            Object.keys(process.env).forEach(variable => {
                expect(environment).to.not.have.property(variable);
            });
        });
    });

    describe('Gitlab CI environment', () => {
        const variables = {
            CI: true,
            GITLAB_CI: true,
            CI_SERVER: true,
            CI_SERVER_NAME: 'gitlab',
            CI_SERVER_VERSION: '8.14',
            CI_SERVER_REVISION: '1.9',
            CI_BUILD_ID: 42,
            CI_BUILD_REF: 'master',
            CI_BUILD_TAG: null,
            CI_BUILD_NAME: 'foo',
            CI_BUILD_STAGE: 'test',
            CI_BUILD_REF_NAME: 'master',
            CI_BUILD_REF_SLUG: 'master',
            CI_BUILD_REPO: 'pmsipilot/jenklab-ci',
            CI_BUILD_TRIGGERED: true,
            CI_BUILD_MANUAL: false,
            CI_BUILD_TOKEN: 'super-secret',
            CI_PIPELINE_ID: 42,
            CI_PROJECT_ID: 42,
            CI_PROJECT_NAME: 'jenklab-ci',
            CI_PROJECT_NAMESPACE: 'pmsipilot',
            CI_PROJECT_PATH: 'pmsipilot/jenklab-ci',
            CI_PROJECT_URL: 'https://github.com/pmsipilot/jenklab-ci',
            CI_PROJECT_DIR: '/some/path/to/pmsipilot/jenklab-ci',
            CI_ENVIRONMENT_NAME: null,
            CI_ENVIRONMENT_SLUG: null,
            CI_REGISTRY: null,
            CI_REGISTRY_IMAGE: null,
            CI_RUNNER_ID: 42,
            CI_RUNNER_DESCRIPTION: 'Super Runner',
            CI_RUNNER_TAGS: 'js',
            CI_DEBUG_TRACE: null,
            GET_SOURCES_ATTEMPTS: 13,
            ARTIFACT_DOWNLOAD_ATTEMPTS: 37,
            RESTORE_CACHE_ATTEMPTS: 42,
            GITLAB_USER_ID: 42,
            GITLAB_USER_EMAIL: 'some@user.com',
        };

        beforeEach(() => { environment = new Environment(variables); });

        it('should allow every Gitlab CI variable', () => {
            Object.keys(variables).forEach(variable => {
                expect(environment[variable]).to.be(variables[variable]);
            });
        });
    });
});
