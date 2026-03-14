import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { getWalletSummary, createCreditOrder, verifyCreditPayment, verifyUpi } from './wallet.controller';

const router = Router();

router.get('/', authenticate, getWalletSummary);

router.post('/credits', authenticate, createCreditOrder );

router.post('/credits/verify', authenticate, verifyCreditPayment);

router.post('/upi/verify',authenticate, verifyUpi)

export default router ;