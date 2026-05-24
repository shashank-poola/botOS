import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { ZodType } from "zod";

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
        console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
};

export const validateBody = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({
                success: false,
                message: null,
                error: err.issues,
            });
            return;
        }
        next(err);
    }
};

export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: null,
            error: err.issues,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: null,
        error: "INTERNAL_SERVER_ERROR",
    });
};
