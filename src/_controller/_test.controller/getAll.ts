import { Request, Response } from "express";
import { ReturnType } from "../../types";
import {
  checkZodSchema,
  response,
  responseError,
  throwError,
} from "../../utils/response";
import { getUserSession } from "../../utils/user";
import z from "zod";
import { prisma } from "../../lib/dbs";

const Schema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
});

export const GetAll = async (req: Request, res: Response): ReturnType => {
  try {
    const body = req.body as z.infer<typeof Schema>;

    checkZodSchema(Schema, body);

    const { name, email } = body;

    const userSession = getUserSession(req);

    // const userId = (req.query.userId || userSession?.id) as string | undefined;
    // if (!userId) throw throwError(404, "userId tidak ditemukan!");

    // const user = await prisma.user.findFirst({ where: { id: userId } });
    // if (!user) throw throwError(404, "Pengguna tidak ditemukan!");

    const data = await prisma.user.findMany({
      take: 10,
    });

    return response(res, 200, "Berhasil mendapatkan data", data);
  } catch (error) {
    return responseError(res, error);
  }
};
