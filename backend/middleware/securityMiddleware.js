const mongoose = require('mongoose');

// In-memory stores
const rateLimitStore = new Map();
const responseCache = new Map();
const pendingRequests = new Map();
const idempotencyStore = new Map();

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  
  // Clean Rate Limits
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Clean Cache
  for (const [key, record] of responseCache.entries()) {
    if (now > record.expiresAt) {
      responseCache.delete(key);
    }
  }

  // Clean Idempotency
  for (const [key, expiresAt] of idempotencyStore.entries()) {
    if (now > expiresAt) {
      idempotencyStore.delete(key);
    }
  }
}, 30000); // every 30 seconds

/**
 * Smart Progressive Rate Limiter & Throttler
 * @param {Object} options - config options
 * @param {number} options.windowMs - time window in ms (default 60s)
 * @param {number} options.limit - normal limit threshold (default 60 hits)
 */
exports.smartRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60000;
  const limit = options.limit || 60;

  return async (req, res, next) => {
    // Generate intelligent key
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'no-agent';
    const userId = req.user ? req.user._id.toString() : 'guest';
    
    // Key combines IP, user agent, user status, and request path
    const key = `rl_${userId}_${clientIp}_${userAgent}_${req.baseUrl}${req.path}`;
    
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        hits: 0,
        resetTime: now + windowMs,
      };
    }

    record.hits += 1;
    rateLimitStore.set(key, record);

    const remaining = Math.max(0, limit - record.hits);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    // Throttling thresholds
    if (record.hits <= limit) {
      // Stage 1: Normal Speed
      return next();
    } else if (record.hits <= limit * 1.5) {
      // Stage 2: Slight Delay (500ms)
      res.setHeader('X-RateLimit-Delay', '500ms');
      await new Promise(r => setTimeout(r, 500));
      return next();
    } else if (record.hits <= limit * 2.5) {
      // Stage 3: Moderate Delay (2000ms)
      res.setHeader('X-RateLimit-Delay', '2000ms');
      await new Promise(r => setTimeout(r, 2000));
      return next();
    } else {
      // Stage 4: Temporary Block
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      console.warn(`⚠️ Rate Limiter blocked request from IP: ${clientIp}, User: ${userId}, Route: ${req.originalUrl}`);
      
      return res.status(429).json({
        success: false,
        message: "You're making requests a little too quickly. Please wait a few seconds and try again.",
        retryAfter,
      });
    }
  };
};

/**
 * Read-only Cache with Request Deduplication (Promise Reuse)
 * @param {number} ttlSeconds - Cache Time-To-Live in seconds
 */
exports.cacheResponse = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = `cache_${req.originalUrl}`;
    const now = Date.now();

    // 1. Check if cached response exists and is not expired
    const cached = responseCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // 2. Check if identical request is already pending database execution (Deduplication)
    if (pendingRequests.has(cacheKey)) {
      res.setHeader('X-Cache', 'DEDUPLICATED');
      try {
        const data = await pendingRequests.get(cacheKey);
        return res.json(data);
      } catch (err) {
        return next(err);
      }
    }

    // Create a new deferred promise resolver to deduplicate future parallel requests
    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    pendingRequests.set(cacheKey, promise);

    // Override res.json to capture response, save in cache, and resolve pending requests
    const originalJson = res.json;
    res.json = function (body) {
      // Save inside response cache if it was successful (has success: true or HTTP 200)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        responseCache.set(cacheKey, {
          data: body,
          expiresAt: Date.now() + (ttlSeconds * 1000),
        });
        resolvePromise(body);
      } else {
        resolvePromise(body);
      }
      
      pendingRequests.delete(cacheKey);
      return originalJson.call(this, body);
    };


    res.setHeader('X-Cache', 'MISS');
    next();
  };
};

/**
 * Cache Invalidator Helper
 * Call this after database updates (POST/PUT/DELETE) to clear cached queries
 */
exports.invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Clear caches matching invalidated patterns
        for (const key of responseCache.keys()) {
          const matched = patterns.some(pattern => key.includes(pattern));
          if (matched) {
            responseCache.delete(key);
            console.log(`🧹 Cache cleared for key: ${key}`);
          }
        }
      }
      return originalJson.call(this, body);
    };
    next();
  };
};

/**
 * Duplicate-Request & Idempotency Validator
 * Stops double-form payments and double-orders within 15 seconds.
 */
exports.idempotencyCheck = () => {
  return (req, res, next) => {
    // Only intercept mutations (POST/PUT)
    if (req.method !== 'POST' && req.method !== 'PUT') return next();

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const payloadSignature = JSON.stringify(req.body);
    const idempotencyKey = `idemp_${clientIp}_${req.originalUrl}_${payloadSignature}`;

    const now = Date.now();
    const expiresAt = idempotencyStore.get(idempotencyKey);

    if (expiresAt && now < expiresAt) {
      console.warn(`🛑 Idempotency Blocked: Duplicate simultaneous request on ${req.originalUrl}`);
      return res.status(409).json({
        success: false,
        message: 'Your request is already being processed. Please wait a moment.',
      });
    }

    // Lock for 15 seconds
    idempotencyStore.set(idempotencyKey, now + 15000);
    next();
  };
};

/**
 * MongoDB ObjectId Parameter Sanitizer
 * Rejects malformed requests instantly to protect database against NoSQL injection
 */
exports.validateObjectId = (paramNames = ['id']) => {
  return (req, res, next) => {
    for (const name of paramNames) {
      const val = req.params[name] || req.query[name];
      if (val) {
        const isValid = mongoose.Types.ObjectId.isValid(val);
        if (!isValid) {
          console.warn(`🛡️ Security Sanitizer: Blocked invalid ObjectId value [${val}] in param [${name}]`);
          return res.status(400).json({
            success: false,
            message: 'Invalid request parameter formatting.',
          });
        }
      }
    }
    next();
  };
};
