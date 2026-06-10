

export function translateHeaders<T>(data: Record<string, T>[], translations: Record<string, string>): Record<string, T>[] {
    let result: Record<string, T>[] = [];

    for (const row of data) {
        const new_data: Record<string, T> = {};
        for (const key in row) {
            const new_key: string | undefined = translations[key];

            if (new_key === undefined) {
                throw new Error(`unexpected header ${key}`);
            }

            new_data[new_key] = row[key] as T;
        }
        result.push(new_data);
    }

    return result;
}
