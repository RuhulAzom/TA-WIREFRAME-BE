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

export const getNotification = async (
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
      page: number,
      total_data: number
    } | null = null


    if (plant === "ALPUKAT") {
      resData = await getAlpukatNotification(req);
    }

    if (!resData) throw throwError(400, "Gagal menyimpan data sensor");

    return response(res, 200, "Berhasil mengambil detail notifikasi", resData.data,
      resData.page,
      resData.total_pages,
      resData.total_data
    );
  } catch (error) {
    return responseError(res, error);
  }
};

const getAlpukatNotification = async (req: Request) => {
  const Schema = z.object({
    page: z.string(),
    take: z.string(),
    status: z.nativeEnum(Status_Notifikasi).optional(),
  });

  const query = req.query as z.infer<typeof Schema>;


  checkZodSchema(Schema, query);

  const userSession = getUserSession(req);

  if (!userSession) throw throwError(401, "Tidak terautentikasi");

  const { page: pageString, take: takeString, status
  } = query;

  const page = parseInt(pageString);
  const take = parseInt(takeString);
  const skip = page * take - take

  const whereClause: Prisma.NotifikasiWhereInput = {
    Kebun: {
      tipe_kebun: "ALPUKAT",
      Pivot_Kebun_User: {
        some: {
          user_id: userSession.id,
        }
      },
    },
    status_notifikasi: status ? status : undefined
  }

  const rawData = await prisma.notifikasi.findMany({
    where: whereClause,
    include: {
      Kebun: true
    },
    orderBy: {
      createdAt: "desc"
    },
    skip,
    take,
  })


  const total_data = await prisma.notifikasi.count({
    where: whereClause,
  })
  const total_pages = Math.ceil(total_data / take)

  return { data: rawData, total_pages, page, total_data }
};

