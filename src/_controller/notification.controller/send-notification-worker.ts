import { Request, Response } from "express";
import { ReturnType } from "../../types";
import {
  checkZodSchema,
  response,
  responseError,
} from "../../utils/response";
import z from "zod";
import {
} from "@prisma/client";
import { prisma } from "../../lib/dbs";
import webpush from "web-push";


const Schema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  icon: z.string().url(),
  data: z.object({
    url: z.string().url(),
  }),
});



export const sendNotificationWorker = async (
  req: Request,
  res: Response
): ReturnType => {
  try {
    const body = req.body as z.infer<typeof Schema>;

    checkZodSchema(Schema, body);

    const notification = body;

    const { title, body: notificationBody, icon, data, userId } = notification;
    console.log(JSON.stringify({ notification }, null, 2));

    const subscriptions = await prisma.notifikasi_Worker.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      return response(res, 200, "Worker belum ada");
    }
    let notificationPayload = {
      title: title,
      body: notificationBody,
      icon: icon,
      data: {
        url: data.url,
      },
    };

    console.log(
      `Sending notification to ${subscriptions.length} subscription(s)`,
    );
    for (const subscription of subscriptions) {
      const index = subscriptions.indexOf(subscription);
      const payload = {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ? subscription.expirationTime.getTime() : null,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };
      console.log(
        {
          payload, notificationPayload
        }
      )
      webpush.sendNotification(payload, JSON.stringify(notificationPayload))
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.warn(
              `Subscription ${index} expired/not found (${err.statusCode}). Removing...`,
            );
            await prisma.notifikasi_Worker.delete({
              where: { id: subscription.id },
            })
          }
        })
    }
    return response(res, 200, "Berhasil worker notification", notification);
  } catch (error) {
    return responseError(res, error);
  }
};
