import { Router, Request, Response, NextFunction } from "express";
import { TemplateService } from "../services/templateService";
import { CreateTemplateInput, UpdateTemplateInput } from "../models/template";

/**
 * HTTP Status codes for consistent usage
 */
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Standard API response wrapper
 */
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    count?: number;
}

/**
 * Middleware for handling async route errors
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware for validating template ID parameter
 */
const validateTemplateId = (req: Request, res: Response, next: NextFunction): void => {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim() === "") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: "Invalid template ID",
            message: "Template ID is required and must be a non-empty string",
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Middleware for validating request body
 */
const validateRequestBody = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.body || typeof req.body !== "object") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: "Invalid request body",
            message: "Request body must be a valid JSON object",
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Centralized error handler for template operations
 */
const handleTemplateError = (error: unknown, operation: string, templateId?: string): { status: number; response: ApiResponse } => {
    console.error(`Error ${operation}${templateId ? ` template ${templateId}` : ""}:`, error);

    if (error instanceof Error) {
        // Handle known error types
        if (error.message.includes("Template not found")) {
            return {
                status: HTTP_STATUS.NOT_FOUND,
                response: {
                    success: false,
                    error: "Template not found",
                    message: templateId ? `Template with ID '${templateId}' does not exist` : "Template not found",
                },
            };
        }

        if (error.message.includes("validation failed")) {
            return {
                status: HTTP_STATUS.BAD_REQUEST,
                response: {
                    success: false,
                    error: "Validation failed",
                    message: error.message,
                },
            };
        }

        if (error.message.includes("Invalid template ID")) {
            return {
                status: HTTP_STATUS.BAD_REQUEST,
                response: {
                    success: false,
                    error: "Invalid template ID",
                    message: error.message,
                },
            };
        }
    }

    // Default to internal server error
    return {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        response: {
            success: false,
            error: `Failed to ${operation}`,
            message: error instanceof Error ? error.message : "Unknown error",
        },
    };
};

/**
 * Template API routes with reduced duplication
 * Implements all CRUD operations for templates (T3.1 - T3.5)
 */
export function createTemplateRoutes(templateService: TemplateService): Router {
    const router = Router();

    /**
     * GET /api/templates - List all templates (T3.1)
     */
    router.get(
        "/templates",
        asyncHandler(async (req: Request, res: Response) => {
            const templates = await templateService.getAllTemplates();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: templates,
                count: templates.length,
            } as ApiResponse);
        })
    );

    /**
     * GET /api/templates/:id - Get specific template (T3.2)
     */
    router.get(
        "/templates/:id",
        validateTemplateId,
        asyncHandler(async (req: Request, res: Response) => {
            const template = await templateService.getTemplateById(req.params.id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: template,
            } as ApiResponse);
        })
    );

    /**
     * POST /api/templates - Create new template (T3.3)
     */
    router.post(
        "/templates",
        validateRequestBody,
        asyncHandler(async (req: Request, res: Response) => {
            const templateInput: CreateTemplateInput = req.body;
            const createdTemplate = await templateService.createTemplate(templateInput);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                data: createdTemplate,
                message: "Template created successfully",
            } as ApiResponse);
        })
    );

    /**
     * PUT /api/templates/:id - Update template (T3.4)
     */
    router.put(
        "/templates/:id",
        validateTemplateId,
        validateRequestBody,
        asyncHandler(async (req: Request, res: Response) => {
            const updateInput: UpdateTemplateInput = {
                id: req.params.id,
                ...req.body,
            };

            const updatedTemplate = await templateService.updateTemplate(updateInput);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: updatedTemplate,
                message: "Template updated successfully",
            } as ApiResponse);
        })
    );

    /**
     * DELETE /api/templates/:id - Delete template (T3.5)
     */
    router.delete(
        "/templates/:id",
        validateTemplateId,
        asyncHandler(async (req: Request, res: Response) => {
            await templateService.deleteTemplate(req.params.id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: `Template '${req.params.id}' deleted successfully`,
            } as ApiResponse);
        })
    );

    /**
     * Global error handler for this router
     */
    router.use((error: any, req: Request, res: Response, next: NextFunction) => {
        const operation = req.method.toLowerCase();
        const templateId = req.params.id;

        const { status, response } = handleTemplateError(error, operation, templateId);
        res.status(status).json(response);
    });

    return router;
}
