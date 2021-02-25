const express = require('express');
const http = require('http');
//const log4js = require('log4js');
const command = require('./src/command.js');
const jobdb = require('./src/jobdb.js');
const jobStatus = require('./src/jobstatus.js');

let running = false;
//const logger = log4js.getLogger("stocker");

let config;
try {
    config = require('./src/config-file.js').load('/converter.conf');

    if (isNaN(config.worker_port)) {
        throw new Error('worker port setting not found');
    }
} catch (error) {
    //    logger.warn(error.message);
    process.exit(1);
}

function getArgArray(argString) {
    if (!argString) {
        return [];
    }

    return Function('"use strict"; return(' + argString + ')')();
}

function fetchJob(forceRunning = false) {
    if (forceRunning === false && running === true) {
        //        logger.debug("skip fetch during another job running");
        return;
    }

    //logger.debug("fetch job");
    jobdb.fetch(function (result) {
        if (!result) {
            //logger.debug("no jobs");
            running = false;
            return;
        }

        running = true;
        jobdb.setRunning(result.id);

        try {
            command.exec(result.command, getArgArray(result.options),
                function (stdout, stderr) {
                    jobdb.setFinish(result.id, {
                        code: jobStatus.exitSuccess,
                        stdout: stdout,
                        stderr: stderr
                    });
                    fetchJob(true);
                }, function (code, stdout, stderr) {
                    jobdb.setFinish(result.id, {
                        code: code,
                        stdout: stdout,
                        stderr: stderr
                    });
                    jobdb.setCancel(result.cmdgroup);
                    fetchJob(true);
                }
            );
        } catch (error) {
            jobdb.setFinish(result.id, {
                code: jobStatus.canceled,
                stderr: error.message
            });
            jobdb.setCancel(result.cmdgroup);
            fetchJob(true);
        }
    });
}

/*** start ***/
const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('query parser', 'extended');
require('./routes/storage.route.js')(app);
require('./routes/converts.route.js')(app);
require('./routes/media.route.js')(app);

// static contents
app.use(express.static('./htdocs'));
app.use('/bundle', express.static('./dist/bundle'));

http.createServer(app).listen(config.worker_port);

// child process
fetchJob();
setInterval(fetchJob, 60000);
