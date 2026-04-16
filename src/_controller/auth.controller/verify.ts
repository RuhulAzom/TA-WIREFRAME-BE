import { Request, Response } from "express";
import { ReturnType } from "../../types";
import { response, responseError, throwError } from "../../utils/response";
import { getUserSession } from "../../utils/user";

export const verify = async (req: Request, res: Response): ReturnType => {
    try {
        const userSession = getUserSession(req);

        if (!userSession) throw throwError(401, "Tidak terautentikasi!");

        return response(res, 200, "Berhasil memverifikasi akun", userSession);
    } catch (error) {
        return responseError(res, error);
    }
};

