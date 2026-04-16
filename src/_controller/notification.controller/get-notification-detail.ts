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


export const getNotificationDetail = async (
  req: Request,
  res: Response,
): ReturnType => {
  try {
    const Schema = z.object({
      id: z.string()
    });

    const query = req.query as z.infer<typeof Schema>;


    checkZodSchema(Schema, query);

    const userSession = getUserSession(req);

    if (!userSession) throw throwError(401, "Tidak terautentikasi");

    const { id } = query;



    const data = await prisma.notifikasi.findUnique({
      where: { id },
    })

    if (!data) throw throwError(404, "Notifikasi tidak ditemukan");

    let chartData: {
      waktu_pengambilan: string;
      suhu_udara: number;
      kelembaban_udara: number;
      suhu_tanah: number;
      kelembaban_tanah: number;
      intensitas_cahaya: number;
    }[] = []

    if (data.analisis_mulai && data.analisis_berakhir) {
      const sensorData = await prisma.sensor_Data.findMany({
        where: {
          kebun_id: data.kebun_id,
          waktu_pengambilan: {
            gte: data.analisis_mulai,
            lte: data.analisis_berakhir,
          }
        }
      })

      chartData = sensorData.map((item) => {
        const date = new Date(item.waktu_pengambilan)
        return {
          waktu_pengambilan: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          suhu_udara: item.suhu_udara || 0,
          kelembaban_udara: item.kelembaban_udara || 0,
          suhu_tanah: item.suhu_tanah || 0,
          kelembaban_tanah: item.kelembaban_tanah || 0,
          intensitas_cahaya: item.intensitas_cahaya || 0,
        }
      })

    }


    const sendData = {
      ...data,
      resiko_penyakit: data.resiko_penyakit.split("|||").map((item) => {
        const [judul, deskripsi] = item.split("||");
        return { judul: judul.trim(), deskripsi: deskripsi.trim() }
      }),
      kemungkinan_penyebab: data.kemungkinan_penyebab.split("|||").map((item) => {
        const [judul, deskripsi] = item.split("||");
        return { judul: judul.trim(), deskripsi: deskripsi.trim() }
      }),
      rekomendasi_pencegahan: data.rekomendasi_pencegahan.split("|||").map((item) => {
        const [judul, deskripsi] = item.split("||");
        return { judul: judul.trim(), deskripsi: deskripsi.trim() }
      }),
      chartData
    }


    return response(res, 200, "Berhasil mengambil detail notifikasi", sendData);
  } catch (error) {
    return responseError(res, error);
  }
};


