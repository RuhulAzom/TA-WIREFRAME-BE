import express from "express";
import Controller from "../_controller/_test.controller/_core";

const TestRouter = express.Router();

TestRouter.get("/", Controller.GetAll);

export { TestRouter };
