const test = require('node:test');
const assert = require('node:assert/strict');
const notificationRoutes = require('../routes/notificationRoutes');

function getRouteEntries(stack) {
  return stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }));
}

test('notification routes expose delete-all history and delete-by-id endpoints', () => {
  const routes = getRouteEntries(notificationRoutes.stack);

  assert(routes.some((route) => route.path === '/user/all' && route.methods.includes('delete')));
  assert(routes.some((route) => route.path === '/:notificationId' && route.methods.includes('delete')));
});
