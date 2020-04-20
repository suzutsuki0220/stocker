const {execFile} = require('child_process');
const jsUtils = require('js-utils');

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

    process.on('error', (err) => {
        console.error(`Failed to start process - ${err}`);
    });

    process.stdout.on('data', (data) => {
        //console.log('stdout >> ' + data);
        stdout = jsUtils.japanese.toUTF8(data);
    });

    process.stderr.on('data', (data) => {
        stderr = jsUtils.japanese.toUTF8(data);
    });

    process.on('close', (code) => {
        if (code === 0) {
            onSuccess(stdout);
        } else {
            onError(code, stderr);
        }
    });
};
