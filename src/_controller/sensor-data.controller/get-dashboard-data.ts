import { Request, Response } from "express";
import { ReturnType } from "../../types";
import {
    checkZodSchema,
    response,
    responseError,
    throwError,
} from "../../utils/response";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import z from "zod";
import { env } from "../../env";
import { prisma } from "../../lib/dbs";
import { Prisma, Status_Notifikasi, Tipe_Tanaman } from "@prisma/client";
import { getUserSession } from "../../utils/user";


export const getDashboardData = async (
    req: Request,
    res: Response,
): ReturnType => {
    try {

        const Schema = z.object({
            kebun_id: z.string()
        });

        const query = req.query as z.infer<typeof Schema>;
        checkZodSchema(Schema, query);
        const { kebun_id } = query;

        const userSession = getUserSession(req);

        if (!userSession) throw throwError(401, "Tidak terautentikasi");



        const notificationData = await prisma.notifikasi.findMany({
            where: {
                status_notifikasi: "AKTIF"
            },
            include: {
                Kebun: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 2,
        })

        let chartData: {
            waktu_pengambilan: string;
            suhu_udara: number;
            kelembaban_udara: number;
            suhu_tanah: number;
            kelembaban_tanah: number;
            intensitas_cahaya: number;
        }[] = []

        const endDate = new Date("2026-03-01T17:00:00Z");
        const startDate = new Date("2026-03-01T17:00:00Z");
        startDate.setHours(endDate.getHours() - 24);

        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);

        if (startDate && endDate) {
            const sensorData = await prisma.sensor_Data.findMany({
                where: {
                    kebun_id: kebun_id,
                    waktu_pengambilan: {
                        gte: startDate,
                        lte: endDate,
                    }
                }
            })

            chartData = sensorData.map((item) => {
                const date = new Date(item.waktu_pengambilan)
                return {
                    // waktu_pengambilan: `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })} ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
                    waktu_pengambilan: `${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
                    suhu_udara: item.suhu_udara || 0,
                    kelembaban_udara: item.kelembaban_udara || 0,
                    suhu_tanah: item.suhu_tanah || 0,
                    kelembaban_tanah: item.kelembaban_tanah || 0,
                    intensitas_cahaya: item.intensitas_cahaya || 0,
                }
            })

        }


        const sendData = {
            notification: notificationData,
            chartData
        }


        return response(res, 200, "Berhasil mengambil data dashboard", sendData);
    } catch (error) {
        return responseError(res, error);
    }
};


