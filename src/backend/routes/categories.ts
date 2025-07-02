import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/categoryService";
import BaseRoute, { ApiResponse, HTTP_STATUS } from "./baseRoute";

export class CategoryRoute extends BaseRoute<CategoryService> {
    createRoutes() {
        this.router.get(
            "/categories",
            this.asyncHandler(async (req: Request, res: Response) => {
                const categories = await this.service.getAllCategories();
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: categories,
                    count: categories.length,
                } as ApiResponse);
            })
        );
        return this.router;
    }

    protected handleRouteError(error: unknown, req: Request): { status: number; response: ApiResponse } {
        const operation = req.method.toLowerCase();

        console.error(`Error ${operation}$:`, error);

        return this.getDefaultError(error, operation);
    }
}
