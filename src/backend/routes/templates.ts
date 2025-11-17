import { Request, Response } from "express";
import { TemplateService } from "../services/templateService";
import { CreateTemplateInput, UpdateTemplateInput } from "../models/template";
import BaseRoute, { ApiResponse, HTTP_STATUS } from "./baseRoute";

export class TemplateRoute extends BaseRoute<TemplateService> {
    createRoutes() {
        /**
         * GET /api/templates - List all templates
         */
        this.router.get(
            "/templates",
            this.asyncHandler(async (req: Request, res: Response) => {
                const templates = await this.service.getAllTemplates();

                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: templates,
                    count: templates.length,
                } as ApiResponse);
            })
        );

        /**
         * GET /api/templates/:id - Get specific template
         */
        this.router.get(
            "/templates/:id",
            this.validateId.bind(this),
            this.asyncHandler(async (req: Request, res: Response) => {
                const template = await this.service.getTemplateById(req.params.id);

                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: template,
                } as ApiResponse);
            })
        );

        /**
         * GET /api/templates/:id/export - Export template as JSON file
         */
        this.router.get(
            "/templates/:id/export",
            this.validateId.bind(this),
            this.asyncHandler(async (req: Request, res: Response) => {
                const { data, filename } = await this.service.getExportData(req.params.id);

                res.setHeader("Content-Type", "application/json");
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                res.status(HTTP_STATUS.OK).send(JSON.stringify(data, null, 2));
            })
        );

        /**
         * POST /api/templates - Create new template
         */
        this.router.post(
            "/templates",
            this.validateRequestBody.bind(this),
            this.asyncHandler(async (req: Request, res: Response) => {
                const templateInput: CreateTemplateInput = req.body;
                const createdTemplate = await this.service.createTemplate(templateInput);

                res.status(HTTP_STATUS.CREATED).json({
                    success: true,
                    data: createdTemplate,
                    message: "Template created successfully",
                } as ApiResponse);
            })
        );

        /**
         * PUT /api/templates/:id - Update template
         */
        this.router.put(
            "/templates/:id",
            this.validateId.bind(this),
            this.validateRequestBody.bind(this),
            this.asyncHandler(async (req: Request, res: Response) => {
                const updateInput: UpdateTemplateInput = {
                    id: req.params.id,
                    ...req.body,
                };

                const updatedTemplate = await this.service.updateTemplate(updateInput);

                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: updatedTemplate,
                    message: "Template updated successfully",
                } as ApiResponse);
            })
        );

        /**
         * DELETE /api/templates/:id - Delete template
         */
        this.router.delete(
            "/templates/:id",
            this.validateId.bind(this),
            this.asyncHandler(async (req: Request, res: Response) => {
                await this.service.deleteTemplate(req.params.id);

                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: `Template '${req.params.id}' deleted successfully`,
                } as ApiResponse);
            })
        );

        return this.router;
    }

    protected handleRouteError(error: unknown, req: Request): { status: number; response: ApiResponse } {
        const operation = req.method.toLowerCase();

        console.error(`Error ${operation}$:`, error);

        if (error instanceof Error) {
            // Handle known error types
            if (error.message.includes("Template not found")) {
                const templateId = req.params.id;
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
        return this.getDefaultError(error, operation);
    }
}
