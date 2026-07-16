const isValidEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const validatePayload = (payload, requiredFields) => {
  const errors = [];

  for (const field of requiredFields) {
    if (!isNonEmptyString(payload[field])) {
      errors.push(`${field} is required`);
    }
  }

  if (payload.email && !isValidEmail(payload.email)) {
    errors.push('email must be a valid email address');
  }

  if (payload.token && !isNonEmptyString(payload.token)) {
    errors.push('token must be a non-empty string');
  }

  return errors;
};

module.exports = { validatePayload };
