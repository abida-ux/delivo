const AdminLog = require('../models/AdminLog');
const User = require('../models/User');

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
          const path = req.baseUrl + req.path;
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

          // Construct argument list from body and params
          const args = [];
          
          if (req.params && Object.keys(req.params).length > 0) {
            for (const [key, val] of Object.entries(req.params)) {
              if (val) args.push(`--${key} "${val}"`);
            }
          }

          if (req.body && Object.keys(req.body).length > 0) {
            const excludedKeys = [
              'password', 'confirmPassword', 'ownerPassword', 'ownerConfirmPassword', 
              'image', 'icon', 'token', 'verificationCode', 'resetPasswordToken'
            ];
            for (const [key, val] of Object.entries(req.body)) {
              if (excludedKeys.includes(key)) {
                args.push(`--${key} "[REDACTED]"`);
              } else if (val !== undefined && val !== null) {
                if (typeof val === 'object') {
                  args.push(`--${key} '${JSON.stringify(val)}'`);
                } else {
                  args.push(`--${key} "${val}"`);
                }
              }
            }
          }

          const fullCommandLine = `${command} ${args.join(' ')}`;
          const details = `Admin ${adminUser.name} (${adminUser.email}) executed ${method} on ${path}`;

          await AdminLog.create({
            admin: adminUser._id,
            adminEmail: adminUser.email,
            adminName: adminUser.name,
            action: actionType,
            command: fullCommandLine,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
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
