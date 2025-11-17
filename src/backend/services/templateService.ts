import { FileManager } from "../utils/fileManager";
import { Template, CreateTemplateInput, UpdateTemplateInput, ExportTemplateData, TemplateValidator, TemplateUtils } from "../models/template";

/**
 * Service for template CRUD operations
 * Handles business logic and file operations for templates
 */
export class TemplateService {
    private fileManager: FileManager;

    constructor(fileManager: FileManager) {
        this.fileManager = fileManager;
    }

    /**
     * Get all templates
     */
    async getAllTemplates(): Promise<Template[]> {
        try {
            const templateFiles = await this.fileManager.listTemplateFiles();
            const templates: Template[] = [];

            for (const file of templateFiles) {
                const templateId = file.replace(".json", "");
                const templatePath = this.fileManager.getTemplatePath(templateId);

                try {
                    const template = await this.fileManager.readJsonFile<Template>(templatePath);
                    TemplateValidator.validateTemplate(template);
                    templates.push(template);
                } catch (error) {
                    console.warn(`Failed to load template ${templateId}: ${error}`);
                    // Continue loading other templates instead of failing completely
                }
            }

            // Sort by modified date (newest first)
            return templates.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
        } catch (error) {
            throw new Error(`Failed to get templates: ${error}`);
        }
    }

    /**
     * Get a single template by ID
     */
    async getTemplateById(id: string): Promise<Template> {
        try {
            const templatePath = this.fileManager.getTemplatePath(id);

            if (!(await this.fileManager.fileExists(templatePath))) {
                throw new Error(`Template not found: ${id}`);
            }

            const template = await this.fileManager.readJsonFile<Template>(templatePath);
            TemplateValidator.validateTemplate(template);

            return template;
        } catch (error) {
            if (error instanceof Error && error.message.includes("Template not found")) {
                throw error;
            }
            throw new Error(`Failed to get template ${id}: ${error}`);
        }
    }

    /**
     * Create a new template
     */
    async createTemplate(input: CreateTemplateInput): Promise<Template> {
        try {
            // Validate input
            TemplateValidator.validateCreateInput(input);

            // Create template with auto-generated ID and timestamps
            const template = TemplateUtils.createTemplate(input);

            // Check if template with this ID already exists (unlikely but possible)
            const templatePath = this.fileManager.getTemplatePath(template.id);
            if (await this.fileManager.fileExists(templatePath)) {
                // Regenerate ID - this should be very rare
                const timestamp = Date.now();
                template.id = `${template.id}-${timestamp}`;
            }

            // Save template
            await this.fileManager.writeJsonFile(this.fileManager.getTemplatePath(template.id), template);

            return template;
        } catch (error) {
            throw new Error(`Failed to create template: ${error}`);
        }
    }

    /**
     * Update an existing template
     */
    async updateTemplate(updates: UpdateTemplateInput): Promise<Template> {
        try {
            // Validate input
            TemplateValidator.validateUpdateInput(updates);

            // Get existing template
            const existing = await this.getTemplateById(updates.id);

            // Update template with new data
            const updated = TemplateUtils.updateTemplate(existing, updates);

            // Validate updated template
            TemplateValidator.validateTemplate(updated);

            // Save updated template
            await this.fileManager.writeJsonFile(this.fileManager.getTemplatePath(updated.id), updated);

            return updated;
        } catch (error) {
            throw new Error(`Failed to update template: ${error}`);
        }
    }

    /**
     * Delete a template
     */
    async deleteTemplate(id: string): Promise<void> {
        try {
            // Check if template exists first
            await this.getTemplateById(id);

            // Delete the template file
            const templatePath = this.fileManager.getTemplatePath(id);
            await this.fileManager.deleteFile(templatePath);
        } catch (error) {
            throw new Error(`Failed to delete template: ${error}`);
        }
    }

    /**
     * Get export data for a template (excludes id, created, modified)
     */
    async getExportData(id: string): Promise<{ data: ExportTemplateData; filename: string }> {
        try {
            const template = await this.getTemplateById(id);
            const exportData = TemplateUtils.createExportData(template);
            const filename = TemplateUtils.generateExportFilename(template.title);

            return { data: exportData, filename };
        } catch (error) {
            throw new Error(`Failed to get export data: ${error}`);
        }
    }
}
