const uuid = require('uuid');

module.exports = function(params) {
    return new Promise((resolve, reject) => {
        if (!params.root || !params.path) {
            reject(new Error("NG"));
        }

        const ret = new Array();
        const cmdgroup = uuid.v4();

        ret.push({
            cmdgroup: cmdgroup,
            command: "/usr/bin/ffmpeg",
            options: "['--help']",
            queue: 0
        });

        resolve(ret);
    });
};
