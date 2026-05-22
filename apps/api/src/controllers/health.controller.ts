import type { Request, Response } from "express";

export const healthController = async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "ok",
        error: null
    })
    return;
}