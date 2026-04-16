import { NextFunction, Request, Response } from "express";
import { ReturnType, UserSession } from "../types";
import { responseError, throwError } from "../utils/response";
import { env } from "../env";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/dbs";

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
): ReturnType => {
    try {
        if (!req.headers) throw throwError(401, "Session telah habis!");

        if (!req.headers.authorization)
            throw throwError(401, "Session telah habis!");
        const token = req.headers.authorization.split(" ")[1];

        if (!token) throw throwError(401, "Session telah habis!");

        let userData: UserSession | null = null;

        if (!env.JWT_SECRET_KEY)
            throw throwError(404, "JWT_SECRET_KEY tidak ditemukan!");

        jwt.verify(token, env.JWT_SECRET_KEY, (error, decode) => {
            if (error) userData = null;
            else userData = decode as any;
        });

        if (userData) {

            const user = {
                ...userData as UserSession,
            };

            (req as any).user = user;

            return next();
        }
        throw throwError(401, "Tidak terautentikasi");
    } catch (error: any) {
        if (!error?.status || error.status >= 500) {
            console.log("Middleware Error:", error);
        }
        return responseError(res, error);
    }
};
