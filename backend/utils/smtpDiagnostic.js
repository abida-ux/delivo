const net = require('net');

const timeoutMs = Number(process.env.SMTP_DIAGNOSTIC_TIMEOUT_MS || 8000);

const classifyError = (error) => {
  if (!error) return 'UNKNOWN_ERROR';
  if (error.code === 'ETIMEDOUT' || error.message.includes('timed out')) {
    return 'TIMEOUT';
  }
  if (error.code === 'ECONNREFUSED') {
    return 'CONNECTION_REFUSED';
  }
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    return 'DNS_FAILURE';
  }
  if (error.code === 'EHOSTUNREACH' || error.code === 'ENETUNREACH') {
    return 'NETWORK_UNREACHABLE';
  }
  return error.code || 'UNKNOWN_ERROR';
};

const checkTcpPort = (host, port, timeout = timeoutMs) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (status, error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        host,
        port,
        status,
        error: error ? classifyError(error) : null,
        message: error ? error.message : 'Connected',
      });
    };

    socket.setTimeout(timeout, () => finish('TIMEOUT', new Error('TCP connection timed out')));
    socket.once('error', (err) => finish('ERROR', err));
    socket.connect(port, host, () => finish('OK'));
  });
};

const runSmtpDiagnostics = async () => {
  const host = process.env.SMTP_HOST || 'mail.spacemail.com';
  const ports = [
    Number(process.env.SMTP_PORT || 465),
    Number(process.env.SMTP_FALLBACK_PORT || 587),
  ].filter((port, index, self) => port && self.indexOf(port) === index);

  const results = [];
  for (const port of ports) {
    results.push(await checkTcpPort(host, port));
  }

  return results;
};

module.exports = {
  checkTcpPort,
  runSmtpDiagnostics,
};
