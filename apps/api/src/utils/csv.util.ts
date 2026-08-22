import Papa from 'papaparse';
import { Parser } from 'json2csv';

export const csvUtil = {
  /**
   * Parse a CSV string or buffer into an array of JSON objects.
   */
  parse: <T>(csvString: string | Buffer): T[] => {
    const data = Buffer.isBuffer(csvString) ? csvString.toString('utf-8') : csvString;
    const result = Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // auto-convert numbers and booleans
    });

    if (result.errors.length > 0) {
      throw new Error(`CSV Parsing Error: ${result.errors[0]?.message} at row ${result.errors[0]?.row}`);
    }

    return result.data as T[];
  },

  /**
   * Convert an array of JSON objects to a CSV string.
   */
  stringify: (data: any[], fields?: string[]): string => {
    const parser = new Parser({ fields });
    return parser.parse(data);
  }
};
