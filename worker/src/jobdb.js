const db = require('../models');
const jobStatus = require('./jobstatus.js');

function onError(error) {
    console.warn(error);
}

module.exports.craete = function(command, options) {
    db.jobs.create({
        command: command,
        options: options
    });
};

module.exports.get = function(onGet) {
    db.jobs.findOne({
        where: {
            status: jobStatus.queued
        },
        order: [['id', 'ASC']]
    }).then(job => {
        onGet(job ? job.get() : null);
    }).catch(onError);
};

module.exports.setRunning = function(id) {
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

module.exports.setFinish = function(id, commandResults) {
    if (isNaN(id)) {
        return;
    }

    db.jobs.update({
        status: commandResults.code,
        stdout: commandResults.stdout,
        stderr: commandResults.stderr
    }, {
        where: {
            id: id
        }
    }).then(() => {
    }).catch(onError);
};

module.exports.cleanup = function() {
    db.jobs.destroy({
        where: {
            status: jobStatus.success
        }
    }).then(() => {
    });
};
