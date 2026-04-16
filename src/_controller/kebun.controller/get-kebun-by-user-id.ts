import { Request, Response } from "express";
import { ReturnType } from "../../types";
import {
    response,
    responseError,
    throwError,
} from "../../utils/response";
import { prisma } from "../../lib/dbs";
import { getUserSession } from "../../utils/user";

export const getKebunByUserId = async (
    req: Request,
    res: Response,
): ReturnType => {
    try {
        const userSession = getUserSession(req);

        if (!userSession) throw throwError(401, "Tidak terautentikasi");
        console.log("User Session:", userSession);

        const tomat = await prisma.kebun.findMany({
            where: {
                Pivot_Kebun_User: {
                    some: {
                        user_id: userSession.id,
                    }
                },
                tipe_kebun: "TOMAT"
            }
        })

        const alpukat = await prisma.kebun.findMany({
            where: {
                Pivot_Kebun_User: {
                    some: {
                        user_id: userSession.id,
                    }
                },
                tipe_kebun: "ALPUKAT"
            }
        })

        const sawi = await prisma.kebun.findMany({
            where: {
                Pivot_Kebun_User: {
                    some: {
                        user_id: userSession.id,
                    }
                },
                tipe_kebun: "SAWI"
            }
        })

        const data = {
            tomat,
            alpukat,
            sawi
        }

        return response(res, 200, "Berhasil mengambil data kebun", data);
    } catch (error) {
        return responseError(res, error);
    }
};

