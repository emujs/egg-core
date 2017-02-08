'use strict';

const assert = require('assert');
const request = require('supertest');
const utils = require('../../utils');

describe('test/loader/mixin/load_middleware.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('middleware-override');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();
  });
  after(() => app.close());

  it('should load application, plugin, and default middlewares', function() {
    assert('static' in app.middlewares);
    assert('status' in app.middlewares);
    assert('custom' in app.middlewares);
    assert('b' in app.middlewares);
    assert(!('a' in app.middlewares));
  });

  it('should override middlewares of plugin by framework', function(done) {
    request(app.callback())
    .get('/status')
    .expect('egg status')
    .end(done);
  });

  it('should override middlewares of plugin by application', function(done) {
    request(app.callback())
    .get('/custom')
    .expect('app custom')
    .end(done);
  });

  it('should override middlewares of egg by application', function(done) {
    request(app.callback())
    .get('/static')
    .expect('static')
    .end(done);
  });

  it('should throw when middleware return no-generator', function() {
    const app = utils.createApp('custom_session_invaild');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
    }, /Middleware session must be a function, but actual is {}/);
  });

  it('should throw when not load that is not configured', function() {
    const app = utils.createApp('no-middleware');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
    }, /Middleware a not found/);
  });

  it('should throw when middleware name redefined', function() {
    const app = utils.createApp('middleware-redefined');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
    }, /Middleware status redefined/);
  });

  it('should core middleware support options.enable', function* () {
    const app = utils.createApp('middleware-disable');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();

    yield request(app.callback())
    .get('/status')
    .expect(404);
    app.close();
  });

  it('should core middleware support options.match', function* () {
    const app = utils.createApp('middleware-match');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();

    yield request(app.callback())
    .get('/status')
    .expect('egg status');

    yield request(app.callback())
    .post('/status')
    .expect(404);
    app.close();
  });

  it('should core middleware support options.ignore', function* () {
    const app = utils.createApp('middleware-ignore');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();

    yield request(app.callback())
    .post('/status')
    .expect('egg status');

    yield request(app.callback())
    .get('/status')
    .expect(404);
    app.close();
  });

  it('should app middleware support options.enable', function* () {
    const app = utils.createApp('middleware-app-disable');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();

    yield request(app.callback())
    .get('/static')
    .expect(404);
    app.close();
  });

  describe('async functions and common functions', () => {
    let app;
    before(() => {
      app = utils.createApp('middleware-aa');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      app.loader.loadMiddleware();
      app.loader.loadController();
      app.loader.loadRouter();
    });

    after(() => app.close());

    it('should support config.middleware', function* () {
      yield request(app.callback())
      .get('/static')
      .expect('static', 'static')
      .expect('hello');
    });

    it('should support app.use', function* () {
      yield request(app.callback())
      .get('/')
      .expect('custom', 'custom')
      .expect('hello');
    });

    it('should support with router', function* () {
      yield request(app.callback())
      .get('/router')
      .expect('router', 'router')
      .expect('hello');
    });

    it('should support with options.match', function* () {
      yield request(app.callback())
      .get('/match')
      .expect('match', 'match')
      .expect('hello');
    });

    it('should support common functions', function* () {
      yield request(app.callback())
      .get('/common')
      .expect('common');
    });
  });
});
