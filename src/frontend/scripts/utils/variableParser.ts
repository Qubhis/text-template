// src/frontend/scripts/utils/variableParser.ts

// Variable Parser Utility
// Handles detection, parsing, and processing of template variables

/**
 * Variable interface representing a detected template variable
 */
export interface Variable {
    name: string;
    type: "text" | "dropdown";
    options?: string[]; // For dropdown type
    isValid: boolean;
    errorMessage?: string;
}

/**
 * Variable values storage interface
 */
export interface VariableValues {
    [variableName: string]: string;
}

/**
 * Variable parsing result interface
 */
export interface ParseResult {
    variables: Variable[];
    errors: string[];
    totalCount: number;
    validCount: number;
}

/**
 * Template processing result interface
 */
export interface ProcessResult {
    content: string;
    filledVariables: string[];
    unfilledVariables: string[];
}

/**
 * Variable Parser Class
 * Provides static methods for variable detection, validation, and template processing
 */
export class VariableParser {
    // Regex patterns for variable detection
    private static readonly VARIABLE_PATTERN = /\{\{([^}]*)\}\}/g;
    private static readonly VARIABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    private static readonly DROPDOWN_PATTERN = /^([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/;

    /**
     * Parse variables from template content
     * Detects both basic variables {{name}} and dropdown variables {{name:option1|option2}}
     */
    static parseVariables(content: string): ParseResult {
        if (!content || typeof content !== "string") {
            return {
                variables: [],
                errors: [],
                totalCount: 0,
                validCount: 0,
            };
        }

        const variables = new Map<string, Variable>();
        const errors: string[] = [];
        let totalCount = 0;

        // Find all variable matches
        const matches = content.matchAll(this.VARIABLE_PATTERN);

        for (const match of matches) {
            totalCount++;
            const fullMatch = match[0]; // {{variableName}} or {{name:options}}
            const innerContent = match[1].trim(); // variableName or name:options

            if (!innerContent) {
                errors.push(`Empty variable found: ${fullMatch}`);
                continue;
            }

            const variable = this.parseVariableDefinition(innerContent, fullMatch);

            if (!variable.isValid) {
                errors.push(variable.errorMessage || `Invalid variable: ${fullMatch}`);
                continue;
            }

            // Check for duplicates with different definitions
            const existing = variables.get(variable.name);
            if (existing) {
                if (!this.areVariablesEqual(existing, variable)) {
                    errors.push(`Variable "${variable.name}" has conflicting definitions`);
                    // Mark both as invalid
                    existing.isValid = false;
                    existing.errorMessage = "Conflicting definitions";
                    variable.isValid = false;
                    variable.errorMessage = "Conflicting definitions";
                }
                continue;
            }

            variables.set(variable.name, variable);
        }

        const variableArray = Array.from(variables.values());
        const validCount = variableArray.filter((v) => v.isValid).length;

        return {
            variables: variableArray,
            errors,
            totalCount,
            validCount,
        };
    }

    /**
     * Process template content by replacing variables with their values
     */
    static processTemplate(content: string, values: VariableValues): ProcessResult {
        if (!content || typeof content !== "string") {
            return {
                content: "",
                filledVariables: [],
                unfilledVariables: [],
            };
        }

        const filledVariables: string[] = [];
        const unfilledVariables: string[] = [];

        // Replace variables with their values
        const processedContent = content.replace(this.VARIABLE_PATTERN, (match, innerContent) => {
            const trimmedInner = innerContent.trim();

            if (!trimmedInner) {
                unfilledVariables.push(match);
                return match; // Keep malformed variables as-is
            }

            const variable = this.parseVariableDefinition(trimmedInner, match);

            if (!variable.isValid) {
                unfilledVariables.push(match);
                return match; // Keep invalid variables as-is
            }

            const value = values[variable.name];

            if (value !== undefined && value !== "") {
                filledVariables.push(variable.name);
                return value;
            } else {
                unfilledVariables.push(variable.name);
                return match; // Keep unfilled variables as {{name}}
            }
        });

        return {
            content: processedContent,
            filledVariables: [...new Set(filledVariables)], // Remove duplicates
            unfilledVariables: [...new Set(unfilledVariables)], // Remove duplicates
        };
    }

    /**
     * Validate variable name
     */
    static isValidVariableName(name: string): boolean {
        if (!name || typeof name !== "string") {
            return false;
        }

        // Must start with letter or underscore, followed by letters, numbers, or underscores
        return this.VARIABLE_NAME_PATTERN.test(name.trim());
    }

    /**
     * Get variable names from content (helper method)
     */
    static getVariableNames(content: string): string[] {
        const parseResult = this.parseVariables(content);
        return parseResult.variables.filter((v) => v.isValid).map((v) => v.name);
    }

    /**
     * Check if content contains variables
     */
    static hasVariables(content: string): boolean {
        if (!content) return false;
        return this.VARIABLE_PATTERN.test(content);
    }

    /**
     * Count variables in content
     */
    static countVariables(content: string): number {
        const parseResult = this.parseVariables(content);
        return parseResult.validCount;
    }

    // Private helper methods

    /**
     * Parse a single variable definition from inner content
     */
    private static parseVariableDefinition(innerContent: string, fullMatch: string): Variable {
        const trimmed = innerContent.trim();

        // Check for dropdown pattern (name:option1|option2|option3)
        const dropdownMatch = trimmed.match(this.DROPDOWN_PATTERN);

        if (dropdownMatch) {
            const name = dropdownMatch[1].trim();
            const optionsString = dropdownMatch[2].trim();

            // Validate variable name
            if (!this.isValidVariableName(name)) {
                return {
                    name: name || "invalid",
                    type: "dropdown",
                    isValid: false,
                    errorMessage: `Invalid variable name: "${name}"`,
                };
            }

            // Parse and validate options
            if (!optionsString) {
                return {
                    name,
                    type: "dropdown",
                    isValid: false,
                    errorMessage: `Dropdown variable "${name}" has no options`,
                };
            }

            const options = optionsString
                .split("|")
                .map((opt) => opt.trim())
                .filter((opt) => opt.length > 0);

            if (options.length === 0) {
                return {
                    name,
                    type: "dropdown",
                    isValid: false,
                    errorMessage: `Dropdown variable "${name}" has no valid options`,
                };
            }

            // Check for duplicate options
            const uniqueOptions = [...new Set(options)];
            if (uniqueOptions.length !== options.length) {
                return {
                    name,
                    type: "dropdown",
                    options: uniqueOptions,
                    isValid: true,
                    errorMessage: `Warning: Dropdown variable "${name}" has duplicate options`,
                };
            }

            return {
                name,
                type: "dropdown",
                options: options,
                isValid: true,
            };
        } else {
            // Basic text variable
            const name = trimmed;

            if (!this.isValidVariableName(name)) {
                return {
                    name: name || "invalid",
                    type: "text",
                    isValid: false,
                    errorMessage: `Invalid variable name: "${name}"`,
                };
            }

            return {
                name,
                type: "text",
                isValid: true,
            };
        }
    }

    /**
     * Check if two variables are equal (same type and options)
     */
    private static areVariablesEqual(var1: Variable, var2: Variable): boolean {
        if (var1.type !== var2.type) {
            return false;
        }

        if (var1.type === "dropdown" && var2.type === "dropdown") {
            const options1 = var1.options || [];
            const options2 = var2.options || [];

            if (options1.length !== options2.length) {
                return false;
            }

            return options1.every((opt, index) => opt === options2[index]);
        }

        return true; // Both text variables are equal
    }
}

export default VariableParser;
