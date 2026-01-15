const PERSONA_MENTION_REGEX = /@([A-Za-z0-9_-]+)/g;

export function extractPersonaMentions(text?: string | null): string[] {
    if (!text) {
        return [];
    }

    const matches = new Set<string>();
    PERSONA_MENTION_REGEX.lastIndex = 0;
    let match;
    while ((match = PERSONA_MENTION_REGEX.exec(text)) !== null) {
        matches.add(match[1]);
    }

    return Array.from(matches);
}

export function stripPersonaMentions(text: string): string {
    return text.replace(PERSONA_MENTION_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}
