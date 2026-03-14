import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { getWalletSummary, createCreditOrder, verifyCreditPayment } from './wallet.controller';

const router = Router();

router.get('/', authenticate, getWalletSummary);

router.post('/credits', authenticate, createCreditOrder );

router.post('/credits/verify', authenticate, verifyCreditPayment);

export default router ;