import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUserForSidebar, markMessageAsSeen, sendMessage, deleteMessage } from "../controllers/messageControllers.js";

const messageRouter =express.Router();

messageRouter.get("/users", protectRoute, getUserForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.delete("/delete/:id", protectRoute, deleteMessage);

export default messageRouter;