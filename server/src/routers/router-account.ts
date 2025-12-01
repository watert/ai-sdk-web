import { Router, Request, Response } from 'express';
import { authMiddleware, getReqUser } from '../middlewares/auth-middleware';

const router = Router();

router.get('/user', async (req: Request, res: Response) => {
  res.json({ data: await req.session.user });
});

export default router;
