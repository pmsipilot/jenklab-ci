# Jenklab CI [![Build Status](https://travis-ci.org/pmsipilot/jenklab-ci.svg?branch=master)](https://travis-ci.org/pmsipilot/jenklab-ci)

![Jenklab CI ](resources/jenklab-ci-horiz.png)

A command-line bridge between Gitlab CI and Jenkins CI.

## Why?

Sometimes your CI is spread between Gitlab CI and Jenkins. Using a single UI to follow all your jobs is better than 
switching between two of them.

Gitlab has a nice UI for pipelines, it better than Jenkins' one.

This utility will let you trigger Jenkins jobs right from Gitlab pipelines. It will also forward the whole Gitlab CI
environment to Jenkins as build parameters.

You will be able to see the whole build log direclty from Gitlab CI.

## Usage

Jenklab CI is accessible through a command-line script:

```sh
pmsipilot-jenklab-ci 1.4.0 - A command-line bridge between Gitlab CI and Jenkins CI
  
USAGE

  jenklab-ci build <job>

ARGUMENTS

  <job>      Job name      required

OPTIONS

  --https                         Use https to reach Jenkins               optional      default: false
  --host <host>                   Jenkins host name                        optional
  --port <port>                   Jenkins port number                      optional
  --username <username>           Jenkins username                         optional
  --token <token>                 Jenkins token                            optional
  --polling-interval <token>      Polling interval (seconds)               optional      default: 5    
  --parameter <descriptor>        Additional parameters                    optional
  --dot                           Use a dot report, do not stream log      optional      default: false

GLOBAL OPTIONS

  -h, --help         Display help
  -V, --version      Display version
  --no-color         Disable colors
  --quiet            Quiet mode - only displays warn and error messages
  -v, --verbose      Verbose mode - will also output debug messages
```

A Docker image is also available to let you add it to your `.gitlab-ci.yml`:

```sh
stages:
    # ...
    - jenkins
    
jenkins-job-name:
    image: pmsipilot/jenklab-ci
    tags:
        - swarm
    stage: jenkins
    when: manual
    script:
        - jenklab-ci build $CI_JOB_NAME
    after_script:
        - jenklab-ci kill
```

## Caveats

* Jenklab CI will stream the Jenkins build log to the Gitlab CI console: this can lead to huge logs stored in your 
Gitlab database.
* Your Jenkins job might take longer due to the time spent in queue. By default, Gitlab CI jobs are killed after 60 
minutes. You might need to change the job timeout in you Gitlab project's CI/CD configuration.

## License

This project is released under the [MIT license](LICENSE) except for the [logos](resources) which are released under 
the [Creative Commons Attribution-ShareAlike 3.0 Unported License](https://creativecommons.org/licenses/by-sa/3.0/) as
requested by the [Jenkins project's](https://jenkins.io/) license [terms](https://wiki.jenkins.io/display/JENKINS/Logo).