import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { askQuestionController , getChatBotMessages } from "./chatbot.controller";

const router = Router();

router.post('/', authenticate , askQuestionController );

router.get('/:id', authenticate , getChatBotMessages );


export default router