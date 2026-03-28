import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { getWalletSummary, createCreditOrder, verifyCreditPayment, verifyUpi } from './wallet.controller';

const router = Router();

router.get('/', authenticate, getWalletSummary);

router.post('/credits', authenticate, authorizeRoles('student', 'admin'), createCreditOrder );

router.post('/credits/verify', authenticate, authorizeRoles('student', 'admin'), verifyCreditPayment);

router.post('/upi/verify',authenticate, verifyUpi)

export default router ;