import express from "express";
import Controller from "../_controller/auth.controller/_core";
import { isAuthenticated } from "../middleware/auth";

const AuthRouter = express.Router();

AuthRouter.post("/login", Controller.login);
AuthRouter.post("/register", Controller.register);
AuthRouter.post("/verify", isAuthenticated, Controller.verify);
AuthRouter.put("/updatePassword", isAuthenticated, Controller.updatePassword);



export { AuthRouter };
