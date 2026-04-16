import { Request, Response } from "express";
import { ReturnType } from "../../types";
import { checkZodSchema, response, responseError, throwError } from "../../utils/response";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import z from "zod";
import { env } from "../../env";
import { prisma } from "../../lib/dbs";

const Schema = z.object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
});

export const register = async (req: Request, res: Response): ReturnType => {
    try {
        const body = req.body as z.infer<typeof Schema>;

        checkZodSchema(Schema, body);

        if (!env.JWT_SECRET_KEY)
            throw throwError(404, "JWT_SECRET_KEY tidak ditemukan!");

        const { username, email, password } = body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) throw throwError(401, "Email sudah digunakan!");

        const hashedPassword = bcrypt.hashSync(password, 10);

        await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        return response(res, 200, "Berhasil membuat akun");
    } catch (error) {
        return responseError(res, error);
    }
};

