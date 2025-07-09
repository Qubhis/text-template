import { Category, DEFAULT_CATEGORIES } from "../models/category";

/**
 * Service for template CRUD operations
 * Handles business logic and file operations for templates
 */
export class CategoryService {
    /**
     * Get all categories
     */
    async getAllCategories(): Promise<Category[]> {
        return DEFAULT_CATEGORIES;
    }
}
