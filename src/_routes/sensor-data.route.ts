import express from "express";
import Controller from "../_controller/sensor-data.controller/_core";
import { isAuthenticated } from "../middleware/auth";
import { isAlatAuthenticated } from "../middleware/auth-alat";

const SensorDataRouter = express.Router();

SensorDataRouter.post("/", isAlatAuthenticated, Controller.createSensorData);
SensorDataRouter.get("/", isAuthenticated, Controller.getSensorData);


SensorDataRouter.post("/dummy", Controller.createSensorDataDummy);

SensorDataRouter.get("/dashboard", isAuthenticated, Controller.getDashboardData);


export { SensorDataRouter };
