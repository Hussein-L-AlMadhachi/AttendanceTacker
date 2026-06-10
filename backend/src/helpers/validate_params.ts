export function validate_params(data: Record<string, any>, valid_params: string[]) {
    const keysSet = new Set(Object.keys(data));

    // 1. No extra keys
    for (const key of keysSet) {
        if (!valid_params.includes(key)) {
            throw new Error("invalid request: unexpected key " + key);
        }
    }

    // 2. All required keys present
    for (const key of valid_params) {
        if (!keysSet.has(key)) {
            throw new Error("invalid request: missing key " + key);
        }
    }
}

export function loose_validate_params(data: Record<string, any>, valid_params: string[]) {
    const keysSet = new Set(Object.keys(data));

    // 2. All required keys present
    for (const key of valid_params) {
        if (!keysSet.has(key)) {
            throw new Error("invalid request: missing key " + key);
        }
    }
}
