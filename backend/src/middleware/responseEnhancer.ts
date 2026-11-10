// src/middleware/responseEnhancer.ts
import { Request, Response, NextFunction } from 'express';

export const responseEnhancer = (req: Request, res: any, next: NextFunction) => {
    res.success = (message: string, data: any = null, code: number = 200) => {
        return res.status(code).json({
            success: true,
            message,
            data,
        });
    };

    res.failure = (message: string, data: any = null, code: number = 500) => {
        return res.status(code).json({
            success: false,
            message,
            data,
        });
    };

    next();
};