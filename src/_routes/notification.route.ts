import express from "express";
import Controller from "../_controller/notification.controller/_core";
import { isAuthenticated } from "../middleware/auth";
import { Status_Notifikasi } from "@prisma/client"

const NotificationRouter = express.Router();

NotificationRouter.get("/", isAuthenticated, Controller.getNotification);
NotificationRouter.post("/", isAuthenticated, Controller.createNotification);

NotificationRouter.put("/status", isAuthenticated, Controller.updateNotificationStatus);
NotificationRouter.get("/detail", isAuthenticated, Controller.getNotificationDetail);
NotificationRouter.get("/count", isAuthenticated, Controller.getNotificationCount);





export { NotificationRouter };
