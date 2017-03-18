const caporal = require('caporal');
const jenkins = require('jenkins');
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
        client.job.build(job, parameters || {}, (err, queue) => {
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
        'RESTORE_CACHE_ATTEMPTS'
    ];

    return new Promise((resolve) => {
        const env = process.env;

        resolve({
            job,
            parameters: Object.keys(env).reduce((previous, key) => {
                for (const index in whitelist) {
                    const allowed = whitelist[index];

                    if ((allowed.exec && allowed.exec(key)) || allowed === key) {
                        previous[key] = env[key];

                        break;
                    }
                }

                return previous;
            }, {})
        });
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

                    return request;
                })
                .then(result => triggerBuild(client, result.job, result.parameters))
                .then(result => waitForBuildToStart(client, result.job, result.id, logger))
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
