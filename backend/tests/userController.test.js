const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const userControllerPath = path.join(__dirname, '..', 'controllers', 'userController.js');
const userModelPath = path.join(__dirname, '..', 'models', 'User.js');
const emailServicePath = path.join(__dirname, '..', 'config', 'emailService.js');

test('registerUser returns an error and deletes the user when verification email delivery fails', async () => {
  const deletedUsers = [];
  const createdUser = {
    _id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'secret123',
    role: 'customer',
    phone: '0712345678',
    isVerified: false,
    verificationResendCount: 0,
    verificationResendWindowStart: new Date(),
    verificationAttempts: 0,
    save: async () => ({}),
  };

  const fakeUserModel = {
    findOne: async () => null,
    create: async () => createdUser,
    findByIdAndDelete: async (id) => {
      deletedUsers.push(id);
      return true;
    },
  };

  const fakeEmailService = {
    sendVerificationEmail: async () => {
      throw new Error('SMTP failed');
    },
    sendPasswordResetEmail: async () => {},
  };

  require.cache[require.resolve(userModelPath)] = {
    id: require.resolve(userModelPath),
    filename: userModelPath,
    loaded: true,
    exports: fakeUserModel,
  };

  require.cache[require.resolve(emailServicePath)] = {
    id: require.resolve(emailServicePath),
    filename: emailServicePath,
    loaded: true,
    exports: fakeEmailService,
  };

  delete require.cache[require.resolve(userControllerPath)];
  const controller = require(userControllerPath);

  const req = {
    body: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'secret123',
      phone: '0712345678',
      role: 'customer',
    },
  };

  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  await controller.registerUser(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 503);
  assert.equal(deletedUsers[0], 'user-1');
  assert.equal(res.body.success, false);
});
