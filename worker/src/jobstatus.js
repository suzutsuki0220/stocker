module.exports = {
    canceled: -4,
    pending: -3,
    queued: -2,
    running: -1,
    exitSuccess: 0,
    isExit: function(code) { return (code >= 0); },
    isFailure: function(code) { return (code > 0); }
};
