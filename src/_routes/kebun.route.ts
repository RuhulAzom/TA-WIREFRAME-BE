import express from "express";
import Controller from "../_controller/kebun.controller/_core";
import { isAuthenticated } from "../middleware/auth";

const KebunRouter = express.Router();

KebunRouter.get("/", isAuthenticated, Controller.getKebunByUserId);

export { KebunRouter };
