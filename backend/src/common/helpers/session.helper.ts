import { Request, Response } from 'express';
import { API_RESPONSES } from '@api-res';

/**
 * Destroys the session and clears the auth cookie, sending the
 * appropriate HTTP response to the client.
 */
export function destroySessionAndClearCookie(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      const errConst = API_RESPONSES.FAILED_LOGOUT;
      res
        .status(errConst.status)
        .json({ error: errConst.message, code: errConst.code });
      return;
    }
    res.clearCookie(process.env.COOKIE_NAME);
    res.status(204).send();
  });
}

