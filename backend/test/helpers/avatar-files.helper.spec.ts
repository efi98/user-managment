import path from 'node:path';

jest.mock('node:fs', () => ({
  unlink: jest.fn((_, cb) => cb(null)),
}));

const fs = require('node:fs');
import { deleteAvatarIfExists } from '@common/helpers';

describe('common/helpers/deleteAvatarIfExists', () => {
  test('returns early when profilePhoto is falsy', async () => {
    await deleteAvatarIfExists('', '/avatars');
    await deleteAvatarIfExists(null as any, '/avatars');
    await deleteAvatarIfExists(undefined as any, '/avatars');
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  test('ignores ENOENT unlink error', async () => {
    fs.unlink.mockImplementationOnce((_, cb) =>
      cb(Object.assign(new Error('missing'), { code: 'ENOENT' }))
    );

    await expect(
      deleteAvatarIfExists('/uploads/avatars/missing.png', '/avatars')
    ).resolves.toBeUndefined();
  });

  test('rethrows unlink error when not ENOENT', async () => {
    fs.unlink.mockImplementationOnce((_, cb) =>
      cb(Object.assign(new Error('fail'), { code: 'EACCES' }))
    );

    await expect(
      deleteAvatarIfExists('/uploads/avatars/x.png', '/avatars')
    ).rejects.toThrow('fail');
  });
});
