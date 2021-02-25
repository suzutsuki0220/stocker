//const log4js = require('log4js');
const { spawn } = require('child_process');
const jsUtils = require('js-utils');
const jobStatus = require('./jobstatus.js');

//const logger = log4js.getLogger("stocker");

function errorWork(code, stderr) {
    //    logger.info(stderr);
    //    logger.error(`process exited with code ${code}`);
}

function isWindows() {
    return process.platform === 'win32';
}

module.exports.exec = function (command, args, onSuccess, onError = errorWork) {
    const encoding = isWindows() ? 'Shift-JIS' : 'utf-8';
    let option = {
        encoding: encoding,
        shell: true
    };
    //    option.uid = 80;
    //    option.gid = 80;
    const process = spawn(command, args, option);

    let stdout = "";
    let stderr = "";
    let hasError = false;

    process.on('error', (err) => {
        hasError = true;
        //        logger.error(`Failed to start process - ${err}`);
        onError(jobStatus.canceled, JSON.stringify(err), stderr);
    });

    process.stdout.on('data', (data) => {
        //        logger.info('stdout >> ' + data);
        stdout += jsUtils.japanese.toUTF8(data.toString());
    });

    process.stderr.on('data', (data) => {
        stderr += jsUtils.japanese.toUTF8(data.toString());
    });

    process.on('close', (code) => {
        if (hasError) {
            return;
        }

        if (code === 0) {
            onSuccess(stdout, stderr);
        } else {
            onError(code, stdout, stderr);
        }
    });
};
