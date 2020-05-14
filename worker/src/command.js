const {execFile} = require('child_process');
const jsUtils = require('js-utils');
const jobStatus = require('./jobstatus.js');

function errorWork(code, stderr) {
    console.log(stderr);
    console.error(`process exited with code ${code}`);
}

function isWindows() {
    return process.platform === 'win32';
}

module.exports.exec = function(command, args, onSuccess, onError = errorWork) {
    const encoding = isWindows() ? 'Shift-JIS' : 'utf-8';
    let option = {
        encoding: encoding
    };
//    option.uid = 80;
//    option.gid = 80;
    const process = execFile(command, args, option);

    let stdout = "";
    let stderr = "";
    let hasError = false;

    process.on('error', (err) => {
        hasError = true;
        //console.error(`Failed to start process - ${err}`);
        onError(jobStatus.canceled, JSON.stringify(err));
    });

    process.stdout.on('data', (data) => {
        //console.log('stdout >> ' + data);
        stdout = jsUtils.japanese.toUTF8(data);
    });

    process.stderr.on('data', (data) => {
        stderr = jsUtils.japanese.toUTF8(data);
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
