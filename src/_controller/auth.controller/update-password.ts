import { Request, Response } from "express";
import { ReturnType } from "../../types";
import { checkZodSchema, response, responseError, throwError } from "../../utils/response";
import { getUserSession } from "../../utils/user";
import z from "zod";
import { prisma } from "../../lib/dbs";
import bcrypt from "bcryptjs";

const Schema = z.object({
    password: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
});


export const updatePassword = async (req: Request, res: Response): ReturnType => {
    try {
        const body = req.body as z.infer<typeof Schema>;

        checkZodSchema(Schema, body);

        const userSession = getUserSession(req);

        if (!userSession) throw throwError(401, "Tidak terautentikasi!");
        const { password, newPassword, confirmPassword } = body;

        if (newPassword !== confirmPassword) throw throwError(400, "Password baru dan konfirmasi password tidak cocok!");

        const user = await prisma.user.findUnique({
            where: { id: userSession.id },
        });

        if (!user) throw throwError(404, "User tidak ditemukan!");

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) throw throwError(401, "Password lama salah!");


        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        await prisma.user.update({
            where: { id: userSession.id },
            data: {
                password: hashedPassword,
            },
        });

        return response(res, 200, "Berhasil memperbarui password");
    } catch (error) {
        return responseError(res, error);
    }
};

