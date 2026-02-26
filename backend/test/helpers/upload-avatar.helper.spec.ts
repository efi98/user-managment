import path from 'node:path';

describe('middleware/uploadAvatar (unit-ish) - migrated', () => {
  test('accepts image mimetype', (done) => {
    jest.resetModules();
    // require the JS middleware from the main backend folder
    // relative path from this file to backend/middleware/uploadAvatar.js
    const { uploadAvatar } = require('../../../backend/middleware/uploadAvatar');

    const req: any = {
      params: { username: 'u1' },
      headers: {},
      method: 'POST',
    };

    const mw = uploadAvatar.single('avatar');

    mw(req, {}, (err: any) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
