const mailTransport = require('./mail');

module.exports = mailTransport;
module.exports.verifyTransporter = mailTransport.verifyTransporter;
module.exports.sendMailWithDiagnostics = mailTransport.sendMailWithDiagnostics;
module.exports.normalizeMailSecureOption = mailTransport.normalizeMailSecureOption;
