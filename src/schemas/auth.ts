import { validString } from "./common";
import { z } from "zod";

export const loginSchema = z.object({
    email: validString('Email', { email: true }),
    password: validString('Password', { min: 3 }),
})
