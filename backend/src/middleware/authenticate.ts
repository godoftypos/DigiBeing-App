import { Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import CustomResponse from 'utils/customResponse';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        userType: string;
    };
}

export const authenticate = (req: AuthenticatedRequest, res: CustomResponse, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.failure("Unauthorized Access", null, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, userType: string };

        req.user = {
            id: decoded.userId,
            userType: decoded.userType
        };
        next();
    } catch (err) {
        return res.failure("Invalid token", { err }, 401);
    }
};
