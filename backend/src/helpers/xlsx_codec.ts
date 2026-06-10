import ExcelJS from 'exceljs';



export interface DecodeXlsxResult<T> {
    data: T[];
    foundHeaders: string[];
    missingHeaders: string[];
    fileHeaders: string[];
}

export async function decodeXlsx<T extends Record<string, any>>(
    buffer: any,
    headersToExtract: string[]
): Promise<DecodeXlsxResult<T>> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const data: T[] = [];

    if (!worksheet) return { data, foundHeaders: [], missingHeaders: [...headersToExtract], fileHeaders: [] };

    const headerRow = worksheet.getRow(1);
    const headerMap: Record<number, string> = {};

    const fileHeaders: string[] = [];
    const trimmedHeaders = headersToExtract.map(h => h.trim());

    headerRow.eachCell((cell, colNumber) => {
        const headerVal = cell.text?.trim();
        if (headerVal) fileHeaders.push(headerVal);
        const index = headerVal ? trimmedHeaders.indexOf(headerVal) : -1;
        if (index !== -1) {
            headerMap[colNumber] = headersToExtract[index] as string;
        }
    });

    const foundHeaders = Object.values(headerMap);
    const missingHeaders = headersToExtract.filter(h => !foundHeaders.includes(h));

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        let hasData = false;

        for (const [colNumber, headerName] of Object.entries(headerMap)) {
            const cell = row.getCell(Number(colNumber));
            let val = cell.value;
            if (val && typeof val === 'object') {
                if ('result' in val) {
                    val = val.result;
                } else if ('richText' in val) {
                    val = (val as any).richText.map((rt: any) => rt.text).join('');
                } else if (val instanceof Date) {
                    val = val.toISOString();
                } else if ('text' in val) {
                    val = (val as any).text;
                }
            }
            rowData[headerName] = val;
            hasData = true;
        }

        if (hasData) {
            data.push(rowData);
        }
    });

    return { data, foundHeaders, missingHeaders, fileHeaders };
}


export async function encodeXlsx(
    data: Record<string, any>[],
    headersToInclude: string[]
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Set up columns based on the headers provided
    worksheet.columns = headersToInclude.map((header) => ({
        header: header,
        key: header,
        width: 20, // Default width
    }));

    // Add rows
    // Filter each object to only include specified keys
    const rows = data.map((item) => {
        const filteredItem: Record<string, any> = {};
        headersToInclude.forEach((header) => {
            filteredItem[header] = item[header];
        });
        return filteredItem;
    });

    worksheet.addRows(rows);

    // Return buffer
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
}
