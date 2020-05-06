const fs = require('fs');

const configPath = process.env.STOCKER_CONF;

const kvPattern = /^[\s$]*(.*?)\s*=["' ]*(.*?)["'; ]*$/;

function getKeyValue(line) {
    if (!line) {
        return null;
    }

    let comment = line.indexOf('#');
    const lineEnd = comment >= 0 ? comment : line.length;

    const kv = line.substring(0, lineEnd);
    const match = kv.match(kvPattern);
    if (!match) {
        return null;
    }

    return [
        match[1].toLowerCase(),
        match[2]
    ];
}

function loadConfig(data) {
    let ret = new Object();

    let sp = 0;
    while(data && sp < data.length) {
        let ep = data.indexOf('\n', sp);
        if (ep < 0) {
            ep = data.length;
        }

        const kv = getKeyValue(data.substring(sp, ep));
        if (kv) {
            ret[kv[0]] = kv[1];
        }

        sp = ep + 1;
    }

    return ret;
}

module.exports.load = function(file) {
    if (!configPath) {
        throw new Error("failed to get STOCKER_CONF from environment value");
    }

    const buffer = fs.readFileSync(configPath + file, 'utf8');

    return loadConfig(buffer);
};
