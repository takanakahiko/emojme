const chai = require('chai');
chai.use(require('chai-shallow-deep-equal'));
const assert = chai.assert;
const sinon = require('sinon');
const fs = require('graceful-fs');

let specHelper = require('../spec-helper');
let EmojiAdd = require('../../lib/emoji-add');
let EmojiAdminList = require('../../lib/emoji-admin-list');
let SlackClient = require('../../lib/slack-client');
let FileUtils = require('../../lib/util/file-utils');

let userStats = require('../../emojme-user-stats').userStats;
let userStatsCli = require('../../emojme-user-stats').userStatsCli;

let sandbox;
beforeEach(() => {
  sandbox = sinon.createSandbox();
});

afterEach(() => {
  sandbox.restore();
});

describe('user-stats', () => {
  let subdomains = ['subdomain1', 'subdomain2'];
  let tokens = ['token1', 'token2'];

  beforeEach(() => {
    getStub = sandbox.stub(EmojiAdminList.prototype, 'get');
    getStub.resolves(
      specHelper.testEmojiList(10)
    );

    // prevent writing during tests
    sandbox.stub(FileUtils, 'saveData').callsFake((arg1, arg2) => Promise.resolve(arg2));
    sandbox.stub(FileUtils, 'mkdirp');
  });

  describe('when one user is given it returns their user stats', () => {
    let validateResults = (result => {
      assert.shallowDeepEqual(result, {
        subdomain1: {
          userStatsResults: [{
            user: 'test-user-0',
            // userEmoji: sinon.match.array,
            subdomain: 'subdomain1',
            originalCount: 5,
            aliasCount: 0,
            totalCount: 5,
            percentage: '50.00'
          }]
        },
        subdomain2: {
          userStatsResults: [{
            user: 'test-user-0',
            // userEmoji: sinon.match.array,
            subdomain: 'subdomain2',
            originalCount: 5,
            aliasCount: 0,
            totalCount: 5,
            percentage: '50.00'
          }]
        }
      });
    });

    it('using the cli', () => {
      process.argv = [
        'node',
        'emojme',
        'sync',
        '--subdomain', 'subdomain1',
        '--subdomain', 'subdomain2',
        '--token', 'token1',
        '--token', 'token2',
        '--user', 'test-user-0'
      ];
      return userStatsCli().then(validateResults);
    });

    it('using the module', () => {
      return userStats(['subdomain1', 'subdomain2'],
        ['token1', 'token2'],
        {user: ['test-user-0']}
      ).then(validateResults);
    });
  });

  describe('when multiple users are given it returns all their user stats', () => {
    let validateResults = (result => {
      assert.shallowDeepEqual(result, {
        subdomain: {
          userStatsResults: [
            {
              user: 'test-user-0',
              // userEmoji: sinon.match.array,
              subdomain: 'subdomain',
              originalCount: 5,
              aliasCount: 0,
              totalCount: 5,
              percentage: '50.00'
            }, {
              user: 'test-user-1',
              // userEmoji: sinon.match.array,
              subdomain: 'subdomain',
              originalCount: 0,
              aliasCount: 5,
              totalCount: 5,
              percentage: '50.00'
            }
          ]
        }
      });
    });

    it('using the cli', () => {
      process.argv = [
        'node',
        'emojme',
        'sync',
        '--subdomain', 'subdomain',
        '--token', 'token',
        '--user', 'test-user-0',
        '--user', 'test-user-1'
      ];
      return userStatsCli().then(validateResults);
    });

    it('using the module', () => {
      return userStats('subdomain', 'token',
        {user: ['test-user-0', 'test-user-1', 'non-existant-user']}
      ).then(validateResults);
    });
  });

  describe('when no users are given, give the top n users', () => {
    let validateResults = (result => {
      assert.shallowDeepEqual(result, {
        subdomain: {
          userStatsResults: [
            {
              user: 'test-user-0',
              // userEmoji: sinon.match.array,
              subdomain: 'subdomain',
              originalCount: 5,
              aliasCount: 0,
              totalCount: 5,
              percentage: '50.00'
            }, {
              user: 'test-user-1',
              // userEmoji: sinon.match.array,
              subdomain: 'subdomain',
              originalCount: 0,
              aliasCount: 5,
              totalCount: 5,
              percentage: '50.00'
            }
          ]
        }
      });
    });

    it('using the cli', () => {
      process.argv = [
        'node',
        'emojme',
        'sync',
        '--subdomain', 'subdomain',
        '--token', 'token',
        '--top', '2'
      ];
      return userStatsCli().then(validateResults);
    });

    it('using the module', () => {
      return userStats('subdomain', 'token', {top: 2}).then(validateResults);
    });
  });
});