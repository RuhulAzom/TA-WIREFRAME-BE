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

const MainSchema = z.object({
    plant: z.nativeEnum(Tipe_Tanaman),
});

export const createSensorData = async (
    req: Request,
    res: Response,
): ReturnType => {
    try {
        const body = req.body as z.infer<typeof MainSchema>;

        checkZodSchema(MainSchema, body);

        if (!env.JWT_SECRET_KEY)
            throw throwError(404, "JWT_SECRET_KEY tidak ditemukan!");

        const { plant } = body;

        let data: any = null

        if (plant === "ALPUKAT") {
            data = await saveAlpukatData(req);
        }

        if (!data) throw throwError(400, "Gagal menyimpan data sensor");

        return response(res, 200, "Berhasil membuat data sensor", data);
    } catch (error) {
        return responseError(res, error);
    }
};

const saveAlpukatData = async (req: Request) => {
    const Schema = z.object({
        suhu_udara: z.number(),
        kelembaban_udara: z.number(),
        suhu_tanah: z.number(),
        kelembaban_tanah: z.number(),
        intensitas_cahaya: z.number(),
        kebun_id: z.string(),
        nama_kebun: z.string(),
        alat_id: z.string(),
        nama_alat: z.string(),
        email: z.string(),
    });

    const body = req.body as z.infer<typeof Schema>;
    console.log({ body })

    checkZodSchema(Schema, body);

    const {
        suhu_udara,
        kelembaban_udara,
        suhu_tanah,
        kelembaban_tanah,
        intensitas_cahaya,
        kebun_id,
        nama_kebun,
        alat_id,
        nama_alat,
    } = body;


    const userSession = getUserSession(req);

    if (!userSession) throw throwError(401, "Tidak terautentikasi");

    const data = await prisma.$transaction(async (prisma) => {
        let checkKebun = await prisma.kebun.findUnique({
            where: {
                id: kebun_id,
            },
        });

        if (!checkKebun) {
            checkKebun = await prisma.kebun.create({
                data: {
                    id: kebun_id,
                    nama_kebun,
                    tipe_kebun: "ALPUKAT"
                },
            });
        }

        let checkAlat = await prisma.alat.findUnique({
            where: {
                id: alat_id,
            },
        });

        if (!checkAlat) {
            checkAlat = await prisma.alat.create({
                data: {
                    id: alat_id,
                    kebun_id: checkKebun.id,
                    nama_alat,
                    tipe_alat: "ALPUKAT",
                },
            });
        }

        let checkPivotKebunUser = await prisma.pivot_Kebun_User.findUnique({
            where: {
                kebun_id_user_id: {
                    kebun_id: checkKebun.id,
                    user_id: userSession.id
                }
            }
        })

        if (!checkPivotKebunUser) {
            await prisma.pivot_Kebun_User.create({
                data: {
                    kebun_id: checkKebun.id,
                    user_id: userSession.id,
                    tipe: "OWNER"
                }
            })
        }

        await prisma.sensor_Data.create({
            data: {
                suhu_udara,
                kelembaban_udara,
                suhu_tanah,
                kelembaban_tanah,
                intensitas_cahaya,
                kebun_id,
                alat_id,
                waktu_pengambilan: new Date(),
            },
        });

        return {
            suhu_udara,
            kelembaban_udara,
            suhu_tanah,
            kelembaban_tanah,
            intensitas_cahaya,
            kebun_id,
            alat_id,
            waktu_pengambilan: new Date(),
        }
    });

    return data
};

