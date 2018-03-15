'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const caporal = require('caporal');
const jenkins = require('jenkins');
const utils = require('jenkins/lib/utils');
const metadata = require('../package.json');
const Build = require('./build');
const BuildStatus = require('./build-status');
const Environment = require('./environment');
const Parameter = require('./parameter');
const Queue = require('./queue');
const Request = require('./request');
const Url = require('./url');

/**
 * @param {Jenkins} client
 * @param {string} job
 * @param {number} build
 *
 * @returns {Promise.<BuildStatus>}
 */
function displayBuildStatus(client, job, build) {
    return new Promise((resolve, reject) => {
        client.build.get(job, build, (err, data) => {
            if (err) {
                reject(err);
            } else if (BuildStatus.isSuccessful(data.result)) {
                resolve(new BuildStatus(job, build, BuildStatus.SUCCESS));
            } else {
                resolve(new BuildStatus(job, build, BuildStatus.FAILURE));
            }
        });
    });
}

/**
 * @param {Jenkins} client
 * @param {string} job
 * @param {number} build
 * @param {boolean} dot
 *
 * @returns {Promise.<Build>}
 */
function streamBuildLog(client, job, build, dot) {
    return new Promise((resolve, reject) => {
        const log = client.build.logStream(job, build);

        log.on('data', (data) => {
            if (dot) {
                process.stdout.write('.');
            } else {
                process.stdout.write(data.toString());
            }
        });
        log.on('error', (error) => { reject(error); });
        log.on('end', () => { resolve(new Build(job, build)); });
    });
}

/**
 * @param {Jenkins} client
 * @param {string}  job
 * @param {number}  queue
 * @param {winston} logger
 * @param {number}  interval
 *
 * @returns {Promise.<Build>}
 */
function waitForBuildToStart(client, job, queue, logger, interval) {
    return new Promise((resolve, reject) => {
        client.queue.item(queue, (err, data) => {
            if (err) {
                reject(err);
            } else if (!data.executable) {
                logger.debug(`Build is waiting in queue: ${data.why}`);

                setTimeout(
                    () => {
                        waitForBuildToStart(client, job, queue, logger, interval).then(resolve, reject);
                    },
                    interval * 1000
                );
            } else {
                logger.info(`Starting ${job}#${data.executable.number}`);

                resolve(new Build(job, data.executable.number));
            }
        });
    });
}

/**
 * @param {Jenkins} client
 * @param {string} job
 * @param {object} parameters
 *
 * @returns {Promise.<Queue>}
 */
function triggerBuild(client, job, parameters) {
    return new Promise((resolve, reject) => {
        client.job.build(job, parameters || {}, (err, queue) => {
            if (err) {
                reject(err);
            } else {
                resolve(new Queue(job, queue));
            }
        });
    });
}

/**
 * @param {string} job
 * @param {Array.<Parameter>} parameters
 *
 * @returns {Promise.<Request>}
 */
function buildJobRequest(job, parameters) {
    return new Promise((resolve) => {
        resolve(
            new Request(
                job,
                parameters.reduce(
                    (previous, parameter) => Object.assign({}, previous, { [parameter.name]: parameter.value }),
                    new Environment(process.env)
                )
            )
        );
    });
}

/**
 * @param {Jenkins} client
 * @param {string} job
 * @param {number} build
 *
 * @returns {Promise.<Build>}
 */
function setBuildDescription(client, job, build) {
    return new Promise((resolve) => {
        const req = {
            path: '{folder}/{number}/submitDescription',
            params: {
                /* eslint-disable new-cap */
                folder: utils.FolderPath(job).path(),
                /* eslint-enable new-cap */
                number: build,
            },
            query: {
                description: `
                    Triggered from <a href="${process.env.CI_PROJECT_URL}">${process.env.CI_PROJECT_PATH}</a> in
                    pipeline #${process.env.CI_PIPELINE_ID} by <a href="mailto:${process.env.GITLAB_USER_EMAIL}">
                    ${process.env.GITLAB_USER_EMAIL}</a>
                `,
            },
        };

        /* eslint-disable no-underscore-dangle */
        client.build.jenkins._post(req, () => { resolve(new Build(job, build)); });
        /* eslint-enable no-underscore-dangle */
    });
}

/**
 * @param {Jenkins} client
 * @param {winston} logger
 * @param {string} job
 * @param {number} build
 */
function cancelBuild(client, logger, job, build) {
    logger.info(`Canceling ${job}#${build}`);

    client.build.stop(job, build, (err) => {
        if (err === null) {
            logger.info('The build has been canceled');
        } else {
            logger.info('Could not cancel the build');
        }
    });
}

/**
 * @param {Jenkins} client
 * @param {winston} logger
 * @param {string} job
 * @param {number} build
 *
 * @returns {Promise.<Build>}
 */
function setBuildCancelHandler(client, logger, job, build) {
    return new Promise((resolve) => {
        const handler = () => {
            cancelBuild(client, logger, job, build);
        };

        process.on('SIGTERM', handler);
        process.on('SIGINT', handler);
        process.on('SIGHUP', handler);

        resolve(new Build(job, build));
    });
}

/**
 * @param {string} job
 * @param {number} build
 *
 * @returns {Promise.<Build>}
 */
function writeBuildIdentifier(job, build) {
    return new Promise((resolve) => {
        fs.writeFileSync(path.join(os.tmpdir(), process.env.CI_JOB_ID), JSON.stringify({ job, build }));

        resolve(new Build(job, build));
    });
}

/**
 * @param {?string} job
 * @param {?number} build
 *
 * @returns {Promise.<Build|null>}
 */
function removeBuildCancelHandler(job, build) {
    return new Promise((resolve) => {
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGHUP');

        resolve(job && build ? new Build(job, build) : null);
    });
}

function parseBool(value) {
    return !!/^1|on?|y(?:es)?|t(?:rue)?$/.exec(value);
}

caporal
    .name(metadata.name)
    .version(metadata.version)
    .description(metadata.description)
    .command('build', 'Build a job on Jenkins')
        .argument('<job>', 'Job name')
        .option('--https', 'Use https to reach Jenkins', caporal.BOOL, parseBool(process.env.JENKLAB_HTTPS))
        .option('--host <host>', 'Jenkins host name', '', process.env.JENKLAB_HOST)
        .option(
            '--port <port>',
            'Jenkins port number',
            caporal.INT,
            process.env.JENKLAB_PORT ? parseInt(process.env.JENKLAB_PORT, 10) : null
        )
        .option('--username <username>', 'Jenkins username', '', process.env.JENKLAB_USERNAME)
        .option('--token <token>', 'Jenkins token', '', process.env.JENKLAB_TOKEN)
        .option('--polling-interval <token>', 'Polling interval (seconds)', caporal.INT, 5)
        .option('--parameter <descriptor>', 'Additional parameters', caporal.REPEATABLE)
        .option('--dot', 'Use a dot report, do not stream log', caporal.BOOL, parseBool(process.env.JENKLAB_DOT))
        .action((args, options, logger) => {
            const client = jenkins({
                baseUrl: new Url(options).toString(),
                crumbIssuer: true,
            });

            let parameters = options.parameter || [];

            if (!Array.isArray(parameters)) {
                parameters = [parameters];
            }

            buildJobRequest(args.job, parameters.map(descriptor => new Parameter(descriptor)))
                .then(request => {
                    logger.debug('Sending request:', request);
                    logger.debug('\n');

                    return request;
                })
                .then(request => triggerBuild(client, request.job, { parameters: request.parameters }))
                .then(queue => {
                    logger.log('Build was queued.');

                    return waitForBuildToStart(client, queue.job, queue.queue, logger, options.pollingInterval);
                })
                .then(build => setBuildCancelHandler(client, logger, build.job, build.build))
                .then(build => writeBuildIdentifier(build.job, build.build))
                .then(build => setBuildDescription(client, build.job, build.build))
                .then(build => streamBuildLog(client, build.job, build.build, !!options.dot))
                .then(build => removeBuildCancelHandler(build.job, build.build))
                .then(build => displayBuildStatus(client, build.job, build.build))
                .then((status) => { process.exit(status.status); })
                .catch((error) => {
                    removeBuildCancelHandler();

                    logger.error(error);
                    logger.error('\n');

                    process.exit(1);
                })
            ;
        })
    .command('kill', 'Kill a job on Jenkins')
        .option('--https', 'Use https to reach Jenkins', caporal.BOOL, parseBool(process.env.JENKLAB_HTTPS))
        .option('--host <host>', 'Jenkins host name', '', process.env.JENKLAB_HOST)
        .option(
            '--port <port>',
            'Jenkins port number',
            caporal.INT,
            process.env.JENKLAB_PORT ? parseInt(process.env.JENKLAB_PORT, 10) : null
        )
        .option('--username <username>', 'Jenkins username', '', process.env.JENKLAB_USERNAME)
        .option('--token <token>', 'Jenkins token', '', process.env.JENKLAB_TOKEN)
        .action((args, options, logger) => {
            if (!process.env.CI_JOB_ID) {
                throw new Error('Could not find the CI_JOB_ID variable');
            }

            const identifierPath = path.join(os.tmpdir(), process.env.CI_JOB_ID);

            if (!fs.existsSync(identifierPath)) {
                throw new Error('Could not find an actual Jenkins build ID');
            }

            const client = jenkins({
                baseUrl: new Url(options).toString(),
                crumbIssuer: true,
            });

            const { job, build } = JSON.parse(fs.readFileSync(identifierPath));

            cancelBuild(client, logger, job, build);
        })
;

caporal.parse(process.argv);
