import express, { Request, Response } from "express";
import cors from "cors";
import { ReturnType } from "./types";
import dotenv from "dotenv";
import { response, responseError, throwError } from "./utils/response";
import { env } from "./env";
import Routes from "./_routes/_core"
import webpush from "web-push";

dotenv.config();
const app = express();

const port = env.PORT;

app.use(cors({
    origin: [
        'https://sistem-deteksi.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173'
    ],
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const vapidKeys = {
    publicKey: env.WEB_PUSH_PUBLIC_KEY,
    privateKey: env.WEB_PUSH_PRIVATE_KEY,
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    throw new Error("VAPID keys are not set in environment variables");
}

webpush.setVapidDetails(
    "mailto:test@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey,
);

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

