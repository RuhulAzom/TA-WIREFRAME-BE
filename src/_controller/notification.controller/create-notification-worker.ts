import { Request, Response } from "express";
import { ReturnType } from "../../types";
import {
  checkZodSchema,
  response,
  responseError,
  throwError,
} from "../../utils/response";
import z from "zod";
import { prisma } from "../../lib/dbs";

const Schema = z.object({
  userId: z.string().min(1),
  endpoint: z.string().url(),
  expirationTime: z.nullable(z.number()),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});



export const createNotificationWorker = async (
  req: Request,
  res: Response
): ReturnType => {
  try {
    const body = req.body as z.infer<typeof Schema>;

    checkZodSchema(Schema, body);

    const subscription = body;

    console.log("Testing subscription data");

    const { endpoint, expirationTime, keys, userId } = subscription;

    console.log("Subscription received:", subscription);

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    await prisma.notifikasi_Worker.create({
      data: {
        userId,
        endpoint,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
    })

    return response(res, 200, "Berhasil worker subscription", subscription);
  } catch (error) {
    return responseError(res, error);
  }
};
