const express = require('express');
const http = require('http');
const command = require('./src/command.js');
const jobdb = require('./src/jobdb.js');

var running = false;

let config;
try {
    config = require('./src/config-file.js').load('/converter.conf');

    if (isNaN(config.worker_port)) {
        throw new Error('worker port setting not found');
    }
} catch(error) {
    console.warn(error.message);
    process.exit(1);
}

function getArgArray(argString) {
    if (!argString) {
        return [];
    }

    return Function('"use strict"; return(' + argString + ')')();
}

function fetchJob() {
    if (running === true) {
        console.debug("skip fetch during another job running");
        return;
    }

    //console.debug("fetch job");
    jobdb.fetch(function(result) {
        if (!result) {
            //console.debug("no jobs");
            return;
        }

        running = true;
        jobdb.setRunning(result.id);

        command.exec(result.command, getArgArray(result.options),
            function(stdout) {
                jobdb.setFinish(result.id, {
                    code: 0,
                    stdout: stdout,
                    stderr: ""
                });
                running = false;
            }, function(code, stderr) {
                jobdb.setFinish(result.id, {
                    code: code,
                    stdout: "",
                    stderr: stderr
                });
                running = false;
            }
        );
    });
}

/*** start ***/
const app = express();
app.use(express.urlencoded({ extended: true }));
require('./routes/converts.route.js')(app);
http.createServer(app).listen(config.worker_port);

// child process
fetchJob();
setInterval(fetchJob, 60000);
