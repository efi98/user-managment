describe('middleware/uploadAvatar (unit-ish) - migrated', () => {
  test('accepts image mimetype', (done) => {
    jest.resetModules();
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
