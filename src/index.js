const caporal = require('caporal');
const jenkins = require('jenkins');
const utils = require('jenkins/lib/utils');
const metadata = require('../package.json');

function displayBuildStatus(client, job, build) {
    return new Promise((resolve, reject) => {
        client.build.get(job, build, (err, data) => {
            if (err) {
                reject(err);
            } else if (data.result !== 'SUCCESS') {
                resolve({ job, id: build, status: 1 });
            } else {
                resolve({ job, id: build, status: 0 });
            }
        });
    });
}

function streamBuildLog(client, job, build) {
    return new Promise((resolve, reject) => {
        const log = client.build.logStream(job, build);

        log.on('data', process.stdout.write.bind(process.stdout));
        log.on('error', (error) => { reject(error); });
        log.on('end', () => { resolve({ job, id: build }); });
    });
}

function waitForBuildToStart(client, job, queue, logger) {
    return new Promise((resolve, reject) => {
        client.queue.item(queue, (err, data) => {
            if (err) {
                reject(err);
            } else if (!data.executable) {
                logger.info(`Build is waiting in queue: ${data.why}`);

                setTimeout(() => { waitForBuildToStart(client, job, queue, logger).then(resolve, reject); }, 5000);
            } else {
                logger.info(`Starting ${job}#${data.executable.number}`);

                resolve({ job, id: data.executable.number });
            }
        });
    });
}

function triggerBuild(client, job, parameters) {
    return new Promise((resolve, reject) => {
        client.job.build(job, parameters || {}, (err, queue) => {
            if (err) {
                reject(err);
            } else {
                resolve({ job, id: queue });
            }
        });
    });
}

function buildJobRequest(job) {
    const whitelist = [
        /^CI$/,
        /^CI_.*$/,
        /^GITLAB.*$/,
        'GET_SOURCES_ATTEMPTS',
        'ARTIFACT_DOWNLOAD_ATTEMPTS',
        'RESTORE_CACHE_ATTEMPTS',
    ];

    return new Promise((resolve) => {
        const env = process.env;

        resolve({
            job,
            parameters: Object.keys(env).reduce((previous, key) => {
                whitelist.forEach((allowed) => {
                    if ((allowed.exec && allowed.exec(key)) || allowed === key) {
                        /* eslint-disable no-param-reassign */
                        previous[key] = env[key];
                        /* eslint-enable no-param-reassign */
                    }
                });

                return previous;
            }, {}),
        });
    });
}

function setBuildDescription(client, job, build) {
    return new Promise((resolve) => {
        /* eslint-disable new-cap */
        const folder = utils.FolderPath(job);
        /* eslint-enable new-cap */

        const req = {
            path: '{folder}/{number}/submitDescription',
            params: {
                folder: folder.path(),
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
        client.build.jenkins._post(req, () => { resolve({ job, id: build }); });
        /* eslint-enable no-underscore-dangle */
    });
}

caporal
    .name(metadata.name)
    .version(metadata.version)
    .description(metadata.description)
    .command('build', 'Build a job on Jenkins')
        .argument('<job>', 'Job name')
        .option('--https')
        .option('--host <host>')
        .option('--port <port>')
        .option('--username <username>')
        .option('--token <token>')
        .action((args, options, logger) => {
            const authentication = `${options.username}:${options.token}`;
            const url = `${options.host}${options.port ? `:${options.port}` : ''}`;
            const client = jenkins({
                baseUrl: `http${options.https ? 's' : ''}://${authentication}@${url}`,
                crumbIssuer: true,
            });

            buildJobRequest(args.job)
                .then(request => {
                    logger.debug('Sending request:', request);
                    logger.debug('\n');

                    return request;
                })
                .then(result => triggerBuild(client, result.job, result.parameters))
                .then(result => waitForBuildToStart(client, result.job, result.id, logger))
                .then(result => setBuildDescription(client, result.job, result.id))
                .then(result => streamBuildLog(client, result.job, result.id))
                .then(result => displayBuildStatus(client, result.job, result.id))
                .then((result) => { process.exit(result.status); })
                .catch((error) => {
                    logger.error(error);
                    logger.error('\n');

                    process.exit(1);
                })
            ;
        })
;

caporal.parse(process.argv);
