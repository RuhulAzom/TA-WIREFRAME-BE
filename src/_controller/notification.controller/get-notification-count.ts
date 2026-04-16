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

const MainSchema = z.object({
  plant: z.nativeEnum(Tipe_Tanaman),
});

export const getNotificationCount = async (
  req: Request,
  res: Response,
): ReturnType => {
  try {
    const query = req.query as z.infer<typeof MainSchema>;

    checkZodSchema(MainSchema, query);


    const { plant } = query;


    if (plant === "ALPUKAT") {
      const resData = await getAlpukat(req);

      return response(res, 200, "Berhasil mengambil notifikasi", resData)
    }

    throw throwError(400, "Gagal mengambil data notifikasi");
  } catch (error) {
    return responseError(res, error);
  }
};

const getAlpukat = async (req: Request) => {

  const userSession = getUserSession(req);

  if (!userSession) throw throwError(401, "Tidak terautentikasi");

  const whereClause: Prisma.NotifikasiWhereInput = {
    Kebun: {
      tipe_kebun: "ALPUKAT",
      Pivot_Kebun_User: {
        some: {
          user_id: userSession.id,
        }
      },
    },
  }

  const active = await prisma.notifikasi.count({
    where: {
      ...whereClause,
      status_notifikasi: "AKTIF"
    },
  })

  const done = await prisma.notifikasi.count({
    where: {
      ...whereClause,
      status_notifikasi: "SELESAI"
    },
  })

  const highPriority = await prisma.notifikasi.count({
    where: {
      ...whereClause,
      status_notifikasi: "AKTIF",
      persentase_resiko: {
        gte: 75
      }
    },
  })

  const total = await prisma.notifikasi.count({
    where: {
      ...whereClause,
    },
  })


  return {
    active, done, highPriority, total,
  }
};

