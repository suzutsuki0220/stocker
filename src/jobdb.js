const db = require('../models');
const jobStatus = require('./jobstatus.js');

let log = null;

function onError(error) {
    if (log) {
        log.warn(error);
    } else {
        console.warn(error);
    }
}

function escapeSingleQuote(string) {
    return string.replace(/'/, "\\'");
}

function getArrayString(array) {
    if (array.length === 0) {
        return '';
    }

    let ret = '';
    for (const str of array) {
        if (ret) {
            ret += ', ';
        }

        ret += '\'"' + escapeSingleQuote(str) + '"\'';
    }

    return '[' + ret + ']';
}

module.exports.setLogger = function (log) {
    this.log = log;
}

module.exports.create = function (jobs) {
    if (!Array.isArray(jobs)) {
        jobs = new Array(jobs);
    }

    jobs.forEach(job => {
        db.jobs.create({
            cmdgroup: job.cmdgroup,
            command: job.command,
            options: getArrayString(job.options),
            queue: job.queue
        });
    });
};

module.exports.get = function (onGet, id = NaN) {
    db.jobs.findOne({
        where: {
            id: id
        },
        order: [['id', 'ASC']]
    }).then(job => {
        onGet(job ? job.get() : null);
    }).catch(onError);
};

module.exports.fetch = function (onGet) {
    db.jobs.findOne({
        where: {
            status: jobStatus.queued
        },
        order: [['id', 'ASC']]
    }).then(job => {
        onGet(job ? job.get() : null);
    }).catch(onError);
};

module.exports.setRunning = function (id) {
    if (isNaN(id)) {
        return;
    }

    db.jobs.update({
        status: jobStatus.running
    }, {
        where: {
            id: id
        }
    }).then(() => {
    }).catch(onError);
};

module.exports.setFinish = function (id, commandResults) {
    if (isNaN(id)) {
        return;
    }

    db.jobs.update({
        status: isNaN(commandResults.code) ? jobStatus.canceled : commandResults.code,
        stdout: commandResults.stdout,
        stderr: commandResults.stderr
    }, {
        where: {
            id: id
        }
    }).then(() => {
    }).catch(onError);
};

module.exports.setCancel = function (groupId) {
    db.jobs.update({
        status: jobStatus.canceled,
    }, {
        where: {
            cmdgroup: groupId,
            status: jobStatus.queued
        }
    }).then(() => {
    }).catch(onError);
}

module.exports.cleanup = function () {
    db.jobs.destroy({
        where: {
            status: jobStatus.success
        }
    }).then(() => {
    });
};
