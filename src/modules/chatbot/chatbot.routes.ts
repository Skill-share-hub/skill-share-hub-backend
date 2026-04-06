import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { askQuestionController , getChatBotMessages , getRoomChatMessages } from "./chatbot.controller";

const router = Router();

router.post('/', authenticate , askQuestionController );

router.get('/:id', authenticate , getChatBotMessages );

router.get('/messages/:id', authenticate , getRoomChatMessages);
export default router