'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/error', controller.home.error);
  router.get('/bad-request', controller.home.badRequest);
  router.get('/*', controller.home.index);
};
