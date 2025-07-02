import { Router, Request, Response, NextFunction } from "express";

/**
 * HTTP Status codes for consistent usage
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    count?: number;
}

export default abstract class BaseRoute<S> {
    protected readonly router: Router;
    protected readonly service: S;

    constructor(service: S) {
        this.router = Router();
        this.service = service;

        this.registerGlobalErrorHandler();
    }

    /**
     * Middleware for handling async route errors
     */
    protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
        return (req: Request, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Middleware for validating request body
     */
    protected validateRequestBody(req: Request, res: Response, next: NextFunction): void {
        if (!req.body || typeof req.body !== "object") {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: "Invalid request body",
                message: "Request body must be a valid JSON object",
            } as ApiResponse);
            return;
        }

        next();
    }

    /**
     * Middleware for validating template ID parameter
     */
    protected validateId(req: Request, res: Response, next: NextFunction): void {
        const { id } = req.params;

        if (!id || typeof id !== "string" || id.trim() === "") {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: "Invalid ID",
                message: "ID is required and must be a non-empty string",
            } as ApiResponse);
            return;
        }

        next();
    }

    protected abstract handleRouteError(error: unknown, req: Request): { status: number; response: ApiResponse };

    protected getDefaultError(error: unknown, operation: string): { status: number; response: ApiResponse } {
        return {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            response: {
                success: false,
                error: `Failed to ${operation}`,
                message: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }

    protected registerGlobalErrorHandler(): void {
        this.router.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
            const { status, response } = this.handleRouteError(error, req);
            res.status(status).json(response);
        });
    }

    abstract createRoutes(): Router;
}
