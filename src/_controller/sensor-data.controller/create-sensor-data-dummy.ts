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
import { Prisma, Tipe_Tanaman } from "@prisma/client";
import { getUserSession } from "../../utils/user";
import { th } from "zod/v4/locales";

const MainSchema = z.object({
    plant: z.nativeEnum(Tipe_Tanaman),
    kebun_id: z.string(),
    alat_id: z.string(),
});

export const createSensorDataDummy = async (
    req: Request,
    res: Response,
): ReturnType => {
    try {
        const body = req.body as z.infer<typeof MainSchema>;

        checkZodSchema(MainSchema, body);

        if (!env.JWT_SECRET_KEY)
            throw throwError(404, "JWT_SECRET_KEY tidak ditemukan!");

        const { plant, kebun_id, alat_id } = body;

        let data: any = null

        if (plant === "ALPUKAT") {
            data = await saveAlpukatData(req, alat_id, kebun_id);
        }

        if (!data) throw throwError(400, "Gagal menyimpan data sensor");

        return response(res, 200, "Berhasil membuat data sensor", data);
    } catch (error) {
        return responseError(res, error);
    }
};

const saveAlpukatData = async (req: Request, alat_id: string, kebun_id: string) => {
    const Schema = z.array(z.object({
        suhu_udara: z.number(),
        kelembaban_udara: z.number(),
        suhu_tanah: z.number(),
        kelembaban_tanah: z.number(),
        intensitas_cahaya: z.number(),
        waktu_pengambilan: z.string(),
    }));

    const payloadData = req.body.data as z.infer<typeof Schema>;

    checkZodSchema(Schema, payloadData);

    await prisma.$transaction(async (prisma) => {
        let checkKebun = await prisma.kebun.findUnique({
            where: {
                id: kebun_id,
            },
        });

        if (!checkKebun) {
            throw throwError(404, "Kebun tidak ditemukan");
        }

        let checkAlat = await prisma.alat.findUnique({
            where: {
                id: alat_id,
            },
        });

        if (!checkAlat) {
            throw throwError(404, "Alat tidak ditemukan");
        }

        for (const data of payloadData) {

            const {
                suhu_udara,
                kelembaban_udara,
                suhu_tanah,
                kelembaban_tanah,
                intensitas_cahaya,
                waktu_pengambilan
            } = data;

            await prisma.sensor_Data.create({
                data: {
                    suhu_udara,
                    kelembaban_udara,
                    suhu_tanah,
                    kelembaban_tanah,
                    intensitas_cahaya,
                    kebun_id,
                    alat_id,
                    waktu_pengambilan: new Date(waktu_pengambilan),
                },
            });

        }
    })




    return payloadData
};

