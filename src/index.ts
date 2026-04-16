import express, { Request, Response } from "express";
import cors from "cors";
import { ReturnType } from "./types";
import dotenv from "dotenv";
import { response, responseError, throwError } from "./utils/response";
import { env } from "./env";
import Routes from "./_routes/_core"

dotenv.config();
const app = express();

const port = env.PORT;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/test", Routes.TestRouter)
app.use("/auth", Routes.AuthRouter)
app.use("/sensor-data", Routes.SensorDataRouter)
app.use("/kebun", Routes.KebunRouter)
app.use("/notification", Routes.NotificationRouter)


app.get("/", async (req: Request, res: Response): ReturnType => {
    try {
        console.log("new Date : ", new Date());
        return response(res, 200, "Halo!");
    } catch (error) {
        return responseError(res, error);
    }
});

app.listen(port, () => {
    try {
        console.log("Server berjalan di port " + port);
    } catch (error) {
        console.log("Terjadi kesalahan pada server:\n" + error);
    }
});

