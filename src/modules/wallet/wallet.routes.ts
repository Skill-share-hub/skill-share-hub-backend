import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { getWalletSummary, createCreditOrder, verifyCreditPayment, verifyUpiController , withdrawalController } from './wallet.controller';
import { withdrawSchema } from './wallet.validation';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();

router.get('/', authenticate, getWalletSummary);

router.post('/credits', authenticate, createCreditOrder );

router.post('/credits/verify', authenticate, verifyCreditPayment);

router.post('/upi/verify',authenticate, authorizeRoles("premiumTutor"), verifyUpiController);

router.post('/credits/withdraw' ,
  authenticate, 
  authorizeRoles("premiumTutor"), 
  validate(withdrawSchema),
  withdrawalController
);

export default router ;