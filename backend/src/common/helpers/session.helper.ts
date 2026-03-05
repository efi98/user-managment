import {Request, Response} from 'express';

/**
 * Destroys the session and clears the auth cookie, sending the
 * appropriate HTTP response to the client.
 */
export function destroySessionAndClearCookie(req: Request, res: Response): void {
    req.session.destroy((err) => {
        if (err) {
            res
                .status(500);
            return;
        }
        res.clearCookie(process.env.COOKIE_NAME);
        res.status(204).send();
    });
}

