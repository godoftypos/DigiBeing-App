import { Response, NextFunction } from "express";

export default interface CustomResponse extends Response {
    success: (message: string, data: any, code?: number) => Response;
    failure: (message: string, data: any, code?: number) => Response;
}

export type CustomRequestHandler = (req: Request, res: CustomResponse) => Promise<any> | any;

export const adaptHandler = (handler: CustomRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        return handler(req, res as CustomResponse);
    };
};