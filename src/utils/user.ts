import { Request } from "express";
import { UserSession } from "../types";

export const getUserSession = (req: Request) => {
    const data = (req as any).user as UserSession;
    return data;
};