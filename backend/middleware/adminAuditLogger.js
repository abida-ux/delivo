const AdminLog = require('../models/AdminLog');
const User = require('../models/User');

// Sensitive key patterns covering credentials, tokens, secrets, M-Pesa PINs, API keys, etc.
const SENSITIVE_KEY_REGEX = /pass(word)?|secret|token|credential|pin|auth|key|code|cvv|card|cookie|session|signature|private|hash/i;

// JWT pattern detector
const JWT_REGEX = /^ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

/**
 * Recursively sanitizes objects, arrays, and primitive values to prevent sensitive data leakage.
 */
const sanitizeValue = (key, value) => {
  if (value === undefined || value === null) {
    return value;
  }

  // If key matches sensitive keywords, redact immediately
  if (key && SENSITIVE_KEY_REGEX.test(key)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    // Redact JWT tokens
    if (JWT_REGEX.test(value.trim())) {
      return '[REDACTED_JWT]';
    }
    // Truncate Base64 image data URIs
    if (value.startsWith('data:image/')) {
      return '[BASE64_IMAGE]';
    }
    // Truncate excessively long strings (e.g. blobs, base64 data)
    if (value.length > 300) {
      return `${value.slice(0, 297)}... [TRUNCATED]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(`${key || 'item'}[${index}]`, item));
  }

  if (typeof value === 'object') {
    const sanitizedObj = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        sanitizedObj[k] = '[REDACTED]';
      } else {
        sanitizedObj[k] = sanitizeValue(k, v);
      }
    }
    return sanitizedObj;
  }

  return value;
};

/**
 * Formats request parameters and body into a clean, safe CLI-style command string.
 */
const formatCommandArguments = (params = {}, body = {}) => {
  const args = [];

  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        const sanitized = sanitizeValue(key, val);
        args.push(`--${key} "${sanitized}"`);
      }
    }
  }

  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    for (const [key, val] of Object.entries(body)) {
      if (val !== undefined && val !== null) {
        const sanitized = sanitizeValue(key, val);
        if (typeof sanitized === 'object') {
          args.push(`--${key} '${JSON.stringify(sanitized)}'`);
        } else {
          args.push(`--${key} "${sanitized}"`);
        }
      }
    }
  }

  return args.join(' ');
};

const adminAuditLogger = async (req, res, next) => {
  // We only log mutating HTTP methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Intercept the response finisher
  const originalJson = res.json;
  const originalSend = res.send;

  let logged = false;

  const logAction = async (statusCode) => {
    if (logged) return;
    logged = true;

    // Only log successful operations (2xx)
    if (statusCode >= 200 && statusCode < 300) {
      try {
        let adminUser = req.dbUser;
        if (!adminUser && req.user && req.user.id) {
          adminUser = await User.findById(req.user.id);
        }

        // Only log actions performed by users with the admin role
        if (adminUser && adminUser.role === 'admin') {
          const path = (req.baseUrl || '') + (req.path || '');
          const method = req.method;

          // Deduce clean resource name from path
          const parts = path.split('/').filter(Boolean);
          // e.g. /api/restaurants -> resource is "restaurants"
          let resource = parts[1] || 'system';

          // Singularize common plural resource names for more intuitive CLI commands
          if (resource.endsWith('ies')) {
            resource = resource.slice(0, -3) + 'y';
          } else if (resource.endsWith('s') && !resource.endsWith('ss')) {
            resource = resource.slice(0, -1);
          }

          let verb = 'action';
          if (method === 'POST') verb = 'create';
          else if (method === 'PUT' || method === 'PATCH') verb = 'update';
          else if (method === 'DELETE') verb = 'delete';

          const command = `${verb}-${resource}`;
          const actionType = `${method} ${path}`;

          // Format command arguments with recursive redaction of sensitive data
          const argsString = formatCommandArguments(req.params, req.body);
          const fullCommandLine = argsString ? `${command} ${argsString}` : command;
          const details = `Admin ${adminUser.name} (${adminUser.email}) executed ${method} on ${path}`;

          const clientIp =
            req.ip ||
            (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
            req.socket?.remoteAddress ||
            '127.0.0.1';

          await AdminLog.create({
            admin: adminUser._id,
            adminEmail: adminUser.email,
            adminName: adminUser.name,
            action: actionType,
            command: fullCommandLine,
            details,
            ipAddress: clientIp,
            userAgent: req.headers['user-agent'] || 'Unknown'
          });
        }
      } catch (err) {
        console.error('⚠️ Admin audit logging error:', err.message);
      }
    }
  };

  // Wrap response JSON and Send handlers
  res.json = function (body) {
    logAction(res.statusCode);
    return originalJson.apply(this, arguments);
  };

  res.send = function (body) {
    logAction(res.statusCode);
    return originalSend.apply(this, arguments);
  };

  next();
};

module.exports = adminAuditLogger;

