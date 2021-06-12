const express = require('express');
const http = require('http');
const path = require('path');
const command = require('./src/command.js');
const jobdb = require('./src/jobdb.js');
const jobStatus = require('./src/jobstatus.js');

const fs = require('fs');
if (!fs.statSync(path.join(__dirname, 'logs'), {throwIfNoEntry: false})) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
}

const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'stocker',
    streams: [
        {
            level: 'info',
            path: path.join(__dirname, 'logs', 'stocker.log'),
            period: '1d',
            count: 7
        }
    ]
});

const stockerConf = require('./config/stocker-conf.json');

let running = false;

try {
    if (isNaN(stockerConf.port)) {
        throw new Error('worker port setting not found');
    }
} catch (error) {
    log.error(error.message);
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
        //        log.debug("skip fetch during another job running");
        return;
    }

    //log.debug("fetch job");
    jobdb.fetch(function (result) {
        if (!result) {
            //log.debug("no jobs");
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
require('./routes/storage.route.js')(app, log);
require('./routes/converts.route.js')(app, log);
require('./routes/media.route.js')(app, log);

// static contents
app.use(stockerConf.htdocsRoot, express.static('./htdocs'));
app.use(stockerConf.htdocsRoot + '/bundle', express.static('./dist/bundle'));

http.createServer(app).listen(stockerConf.port);

// child process
fetchJob();
setInterval(fetchJob, 60000);
