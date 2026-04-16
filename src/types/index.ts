import { Prisma, PrismaClient, } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export type ReturnType = Promise<any>;

export type UserSession =
  | {
    id: string;
    email: string;
    username: string;
  }
  | null
  | undefined;


export type PrismaTransactionType = Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use">