const command = require('./src/command.js');
const jobdb = require('./src/jobdb.js');

var running = false;

/*
const configPath = process.env.STOCKER_CONF;

if (! configPath) {
    console.warn("cannot get environment value STOCKER_CONF");
    process.exit(1);
}
*/

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

    console.debug("fetch job");
    jobdb.get(function(result) {
        if (!result) {
            console.debug("no jobs");
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

setInterval(fetchJob, 60000);
