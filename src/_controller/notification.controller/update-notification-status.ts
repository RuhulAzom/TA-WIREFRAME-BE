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


export const updateNotificationStatus = async (
  req: Request,
  res: Response,
): ReturnType => {
  try {
    const Schema = z.object({
      id: z.string(),
      status: z.nativeEnum(Status_Notifikasi),
    });

    const body = req.body as z.infer<typeof Schema>;


    checkZodSchema(Schema, body);

    const userSession = getUserSession(req);

    if (!userSession) throw throwError(401, "Tidak terautentikasi");

    const { id, status } = body;



    const data = await prisma.notifikasi.findUnique({
      where: { id },
    })

    if (!data) throw throwError(404, "Notifikasi tidak ditemukan");

    await prisma.notifikasi.update({
      where: { id },
      data: {
        status_notifikasi: status,
      }
    })


    return response(res, 200, "Berhasil mengupdate status notifikasi");
  } catch (error) {
    return responseError(res, error);
  }
};


