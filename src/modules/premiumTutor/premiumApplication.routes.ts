import { Router } from "express";
import * as PremiumApplicationController from "./premiumApplication.controller";
import  {authenticate}  from "../../middlewares/auth.middleware"; 
import { submitApplicationSchema } from "./validators/submitApplication.validate";
import { validate } from "../../middlewares/validate.middleware";
import { uploadApplicationFiles } from "../../utils/multer";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { validateObjectId } from "../../middlewares/validateObjectId.middleware";

const router = Router();


router.use(authenticate);

router.post("/",uploadApplicationFiles,validate(submitApplicationSchema),PremiumApplicationController.submitApplication);
router.get("/status", PremiumApplicationController.getApplicationStatus);
router.delete("/:id", PremiumApplicationController.deleteApplication);
router.put("/:id/resubmit", PremiumApplicationController.resubmitApplication);


// ─────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────
authorizeRoles("admin")
router.get("/admin/all",PremiumApplicationController.getAllApplications);
router.get("/admin/:id", validateObjectId("id"),PremiumApplicationController.getApplicationById);
router.patch("/admin/:id/approve", validateObjectId("id"),PremiumApplicationController.approveApplication);
router.patch("/admin/:id/reject", validateObjectId("id"),PremiumApplicationController.rejectApplication);
export default router;