import VariableParser from "../../scripts/utils/variableParser.js";

/**
 * Test Suite for VariableParser
 * Simple test runner for validation during development
 */
export class VariableParserTests {
    static runAllTests(): { passed: number; failed: number; errors: string[] } {
        const errors: string[] = [];
        let passed = 0;
        let failed = 0;

        const tests = [
            // Basic variable parsing tests
            () => this.testBasicVariableParsing(),
            () => this.testDropdownVariableParsing(),
            () => this.testMalformedVariables(),
            () => this.testDuplicateVariables(),
            () => this.testTemplateProcessing(),
            () => this.testEdgeCases(),
        ];

        tests.forEach((test, index) => {
            try {
                const result = test();
                if (result.success) {
                    passed++;
                    console.log(`✅ Test ${index + 1}: ${result.message}`);
                } else {
                    failed++;
                    const error = `❌ Test ${index + 1}: ${result.message}`;
                    console.error(error);
                    errors.push(error);
                }
            } catch (error) {
                failed++;
                const errorMsg = `💥 Test ${index + 1} crashed: ${error}`;
                console.error(errorMsg);
                errors.push(errorMsg);
            }
        });

        console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
        return { passed, failed, errors };
    }

    private static testBasicVariableParsing() {
        const content = "Hello {{name}}, welcome to {{location}}!";
        const result = VariableParser.parseVariables(content);

        const success =
            result.variables.length === 2 &&
            result.variables[0].name === "name" &&
            result.variables[0].type === "text" &&
            result.variables[1].name === "location" &&
            result.variables[1].type === "text" &&
            result.validCount === 2;

        return {
            success,
            message: success ? "Basic variable parsing works" : `Expected 2 text variables, got ${JSON.stringify(result)}`,
        };
    }

    private static testDropdownVariableParsing() {
        const content = "Priority: {{priority:high|medium|low}}";
        const result = VariableParser.parseVariables(content);

        const variable = result.variables[0];
        const success =
            result.variables.length === 1 &&
            variable.name === "priority" &&
            variable.type === "dropdown" &&
            variable.options?.length === 3 &&
            variable.options.includes("high");

        return {
            success,
            message: success ? "Dropdown variable parsing works" : `Expected dropdown variable, got ${JSON.stringify(variable)}`,
        };
    }

    private static testMalformedVariables() {
        const content = "Bad: {{}} and {{invalid name}} and {{valid_name}}";
        const result = VariableParser.parseVariables(content);

        const success =
            result.errors.length >= 2 && // Should have errors for empty and invalid name
            result.validCount === 1 && // Only valid_name should be valid
            result.variables.some((v) => v.name === "valid_name" && v.isValid);

        return {
            success,
            message: success ? "Malformed variable detection works" : `Expected 2+ errors and 1 valid, got ${JSON.stringify(result)}`,
        };
    }

    private static testDuplicateVariables() {
        const content = "{{name}} and {{name}} again, but also {{name:option1|option2}}";
        const result = VariableParser.parseVariables(content);

        // Should detect conflict between text and dropdown versions of 'name'
        const success = result.errors.some((e) => e.includes("conflicting"));

        return {
            success,
            message: success ? "Duplicate variable conflict detection works" : `Expected conflict error, got ${JSON.stringify(result)}`,
        };
    }

    private static testTemplateProcessing() {
        const content = "Hello {{name}}, your priority is {{priority:high|medium|low}}!";
        const values = { name: "John", priority: "high" };
        const result = VariableParser.processTemplate(content, values);

        const success =
            result.content === "Hello John, your priority is high!" && result.filledVariables.length === 2 && result.unfilledVariables.length === 0;

        return {
            success,
            message: success ? "Template processing works" : `Expected filled template, got: ${result.content}`,
        };
    }

    private static testEdgeCases() {
        // Test empty content, null values, etc.
        const emptyResult = VariableParser.parseVariables("");
        const nullResult = VariableParser.processTemplate("test", null as any);

        const success = emptyResult.variables.length === 0 && typeof nullResult.content === "string";

        return {
            success,
            message: success ? "Edge cases handled correctly" : "Edge cases failed",
        };
    }
}
