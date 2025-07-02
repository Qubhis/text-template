// Category interface
export interface Category {
    id: string;
    name: string;
    color?: string;
    isCustom: boolean;
}

const LLM_PROMPT = {
    id: "llm-prompt",
    name: "LLM Prompts",
    isCustom: false,
} as const;

const JIRA_TEMPLATE = {
    id: "jira-template",
    name: "JIRA Templates",
    isCustom: false,
} as const;

const OTHER = {
    id: "other",
    name: "Other",
    isCustom: false,
} as const;

export const DEFAULT_CATEGORIES: Category[] = [LLM_PROMPT, JIRA_TEMPLATE, OTHER] as const;
