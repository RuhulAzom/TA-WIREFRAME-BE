import { NextFunction, Request, Response } from "express";
import { ReturnType, UserSession } from "../types";
import { responseError, throwError } from "../utils/response";
import { env } from "../env";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/dbs";
import bcrypt from "bcryptjs";

export const isAlatAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
): ReturnType => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            throw throwError(401, "Email dan password harus diisi!");

        const userData = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!userData)
            throw throwError(401, "Email tidak ditemukan!");

        const isPasswordValid = await bcrypt.compare(password, userData.password);

        if (!isPasswordValid)
            throw throwError(401, "Password salah!");

        if (userData) {

            (req as any).user = {
                id: userData.id,
                email: userData.email,
                username: userData.username,
            }
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
