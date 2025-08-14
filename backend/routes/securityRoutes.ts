import express from 'express';
import csrfProtection from '../middlewares/csrfProtection';

const router = express.Router();

router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

export default router;