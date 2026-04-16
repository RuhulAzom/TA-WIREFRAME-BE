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

const MainSchema = z.object({
    plant: z.nativeEnum(Tipe_Tanaman),
});

export const getSensorData = async (
    req: Request,
    res: Response,
): ReturnType => {
    try {
        const query = req.query as z.infer<typeof MainSchema>;

        checkZodSchema(MainSchema, query);


        const { plant } = query;

        let resData: {
            data: any,
            total_pages: number,
            page: number
        } | null = null


        if (plant === "ALPUKAT") {
            resData = await getAlpukatData(req);
        }

        if (!resData) throw throwError(400, "Gagal menyimpan data sensor");

        return response(res, 200, "Berhasil mengambil data sensor", resData.data,
            resData.page,
            resData.total_pages
        );
    } catch (error) {
        return responseError(res, error);
    }
};

const getAlpukatData = async (req: Request) => {
    const Schema = z.object({
        kebun_id: z.string(),
        page: z.string(),
        take: z.string(),
    });

    const query = req.query as z.infer<typeof Schema>;


    checkZodSchema(Schema, query);

    const { kebun_id, page: pageString, take: takeString,
    } = query;

    const page = parseInt(pageString);
    const take = parseInt(takeString);
    const skip = page * take - take

    const whereClause: Prisma.Sensor_DataWhereInput = {
        kebun_id
    }

    const rawData = await prisma.sensor_Data.findMany({
        where: whereClause,
        orderBy: {
            waktu_pengambilan: "desc"
        },
        skip,
        take,
    })

    const data = rawData.map((item) => ({
        id: item.id,
        suhu_udara: item.suhu_udara,
        kelembaban_udara: item.kelembaban_udara,
        suhu_tanah: item.suhu_tanah,
        kelembaban_tanah: item.kelembaban_tanah,
        intensitas_cahaya: item.intensitas_cahaya,
        kebun_id: item.kebun_id,
        alat_id: item.alat_id,
        waktu_pengambilan: item.waktu_pengambilan,
    }))

    const total_data = await prisma.sensor_Data.count({
        where: whereClause,
    })
    const total_pages = Math.ceil(total_data / take)

    return { data, total_pages, page }
};

