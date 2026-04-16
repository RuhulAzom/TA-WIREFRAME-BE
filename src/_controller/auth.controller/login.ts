import { Request, Response } from "express";
import { ReturnType } from "../../types";
import { checkZodSchema, response, responseError, throwError } from "../../utils/response";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import z from "zod";
import { env } from "../../env";
import { prisma } from "../../lib/dbs";

const Schema = z.object({
    email: z.string().optional(),
    password: z.string(),
});

export const login = async (req: Request, res: Response): ReturnType => {
    try {
        const body = req.body as z.infer<typeof Schema>;

        checkZodSchema(Schema, body);

        if (!env.JWT_SECRET_KEY)
            throw throwError(404, "JWT_SECRET_KEY tidak ditemukan!");

        const { email, password } = body;

        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) throw throwError(401, "Email tidak ditemukan!");

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);

        if (!isPasswordCorrect) throw throwError(401, "Password salah!");

        const decodeData = {
            id: user.id,
            email: user.email,
            username: user.username,
        };


        const jwtToken = jwt.sign(decodeData, env.JWT_SECRET_KEY, { expiresIn: "7d" });

        console.log("Token Length : ", jwtToken.length);

        const data = {
            token: jwtToken,
            user: {
                ...decodeData,
            },
        };

        return response(res, 200, "Berhasil masuk", data);
    } catch (error) {
        return responseError(res, error);
    }
};

