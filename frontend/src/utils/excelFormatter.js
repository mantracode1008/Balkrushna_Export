/**
 * Excel Formatter Utility
 * Provides consistent, professional Excel formatting for all exports
 * Uses xlsx-js-style for advanced styling
 */

import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-js-style';

// ==============================================
// STYLED WORKBOOK CREATION
// ==============================================

/**
 * Create a new styled workbook with default properties
 */
export const createStyledWorkbook = () => {
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: "Balkrishna Exports Report",
        Subject: "Business Intelligence Report",
        Author: "Balkrishna Exports",
        CreatedDate: new Date()
    };
    return wb;
};

// ==============================================
// HEADER ROW FORMATTING
// ==============================================

/**
 * Add a styled header row with freeze pane
 * @param {Object} ws - Worksheet object
 * @param {Array} headers - Array of header strings
 * @param {number} rowNumber - Row number (0-indexed)
 */
export const addHeaderRow = (ws, headers, rowNumber = 0) => {
    const headerStyle = {
        font: {
            name: "Calibri",
            sz: 11,
            bold: true,
            color: { rgb: "FFFFFF" }
        },
        fill: {
            fgColor: { rgb: "4472C4" }
        },
        alignment: {
            vertical: "center",
            horizontal: "center",
            wrapText: false
        },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    // Add header row
    const headerRow = [];
    headers.forEach((header, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowNumber, c: colIndex });
        ws[cellRef] = {
            v: header,
            t: 's',
            s: headerStyle
        };
        headerRow.push(header);
    });

    // Set freeze pane (freeze first row)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    return ws;
};

// ==============================================
// DATA ROWS FORMATTING
// ==============================================

/**
 * Add data rows with alternating colors
 * @param {Object} ws - Worksheet object
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column keys
 * @param {number} startRow - Starting row number (0-indexed)
 * @param {Object} options - Formatting options
 */
export const addDataRows = (ws, data, columns, startRow = 1, options = {}) => {
    const {
        alternateRowColor = true,
        conditionalFormatting = null
    } = options;

    const evenRowStyle = {
        fill: { fgColor: { rgb: "FFFFFF" } },
        border: {
            top: { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left: { style: "thin", color: { rgb: "E0E0E0" } },
            right: { style: "thin", color: { rgb: "E0E0E0" } }
        },
        alignment: {
            vertical: "center"
        }
    };

    const oddRowStyle = {
        fill: { fgColor: { rgb: "F9FAFB" } },
        border: {
            top: { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left: { style: "thin", color: { rgb: "E0E0E0" } },
            right: { style: "thin", color: { rgb: "E0E0E0" } }
        },
        alignment: {
            vertical: "center"
        }
    };

    data.forEach((row, rowIndex) => {
        const actualRowNumber = startRow + rowIndex;
        const isEvenRow = rowIndex % 2 === 0;
        const baseStyle = alternateRowColor ? (isEvenRow ? evenRowStyle : oddRowStyle) : evenRowStyle;

        columns.forEach((col, colIndex) => {
            const cellRef = XLSX.utils.encode_cell({ r: actualRowNumber, c: colIndex });
            let value = row[col.key];
            let cellType = 'n'; // default to number

            // Determine cell type
            if (typeof value === 'string') {
                cellType = 's';
            } else if (typeof value === 'number') {
                cellType = 'n';
            } else if (value instanceof Date) {
                cellType = 'd';
            } else {
                value = String(value || '');
                cellType = 's';
            }

            let cellStyle = { ...baseStyle };

            // Apply conditional formatting
            if (conditionalFormatting && conditionalFormatting(row, col.key)) {
                const conditionalStyle = conditionalFormatting(row, col.key);
                cellStyle = { ...cellStyle, ...conditionalStyle };
            }

            // Apply number formatting for currency columns
            if (col.type === 'currency') {
                cellStyle.numFmt = col.currency === 'INR' ? '₹#,##0.00' : '$#,##0.00';
            } else if (col.type === 'number') {
                cellStyle.numFmt = '#,##0.00';
            } else if (col.type === 'percentage') {
                cellStyle.numFmt = '0.00%';
            } else if (col.type === 'date') {
                cellStyle.numFmt = 'yyyy-mm-dd';
            }

            // Apply right alignment for numbers
            if (col.type === 'currency' || col.type === 'number') {
                cellStyle.alignment = { ...cellStyle.alignment, horizontal: 'right' };
            }

            ws[cellRef] = {
                v: value,
                t: cellType,
                s: cellStyle
            };
        });
    });

    return ws;
};

// ==============================================
// TOTALS ROW FORMATTING
// ==============================================

/**
 * Add a totals row with bold styling and yellow background
 * @param {Object} ws - Worksheet object
 * @param {Object} totals - Object with column keys and total values
 * @param {Array} columns - Array of column keys
 * @param {number} rowNumber - Row number (0-indexed)
 */
export const addTotalsRow = (ws, totals, columns, rowNumber) => {
    const totalsStyle = {
        font: {
            name: "Calibri",
            sz: 11,
            bold: true
        },
        fill: {
            fgColor: { rgb: "FFE699" }
        },
        alignment: {
            vertical: "center",
            horizontal: "right"
        },
        border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    columns.forEach((col, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowNumber, c: colIndex });
        let value = totals[col.key] !== undefined ? totals[col.key] : '';

        // First column typically shows "TOTAL" label
        if (colIndex === 0 && value === '') {
            value = 'TOTAL';
        }

        let cellStyle = { ...totalsStyle };

        // Apply number formatting
        if (col.type === 'currency') {
            cellStyle.numFmt = col.currency === 'INR' ? '₹#,##0.00' : '$#,##0.00';
        } else if (col.type === 'number') {
            cellStyle.numFmt = '#,##0.00';
        }

        // Left-align the first column (TOTAL label)
        if (colIndex === 0) {
            cellStyle.alignment = { ...cellStyle.alignment, horizontal: 'left' };
        }

        ws[cellRef] = {
            v: value,
            t: typeof value === 'number' ? 'n' : 's',
            s: cellStyle
        };
    });

    return ws;
};

// ==============================================
// CONDITIONAL FORMATTING
// ==============================================

/**
 * Create conditional formatting function for overdue/paid status
 */
export const createStatusConditionalFormat = () => {
    return (row, columnKey) => {
        if (columnKey === 'balance_due' || columnKey === 'totalDue' || columnKey === 'due') {
            const value = parseFloat(row[columnKey] || 0);
            if (value > 0) {
                return {
                    font: { color: { rgb: "B91C1C" }, bold: true }, // Red text
                    fill: { fgColor: { rgb: "FEE2E2" } } // Light red background
                };
            } else {
                return {
                    font: { color: { rgb: "059669" } }, // Green text
                };
            }
        }

        if (columnKey === 'payment_status' || columnKey === 'status') {
            const status = String(row[columnKey] || '').toLowerCase();
            if (status === 'paid') {
                return {
                    font: { color: { rgb: "059669" }, bold: true },
                    fill: { fgColor: { rgb: "D1FAE5" } }
                };
            } else if (status === 'overdue') {
                return {
                    font: { color: { rgb: "B91C1C" }, bold: true },
                    fill: { fgColor: { rgb: "FEE2E2" } }
                };
            } else if (status === 'pending' || status === 'partial') {
                return {
                    font: { color: { rgb: "D97706" } },
                    fill: { fgColor: { rgb: "FEF3C7" } }
                };
            }
        }

        return null;
    };
};

// ==============================================
// COLUMN WIDTH CALCULATION
// ==============================================

/**
 * Auto-size columns based on content
 * @param {Object} ws - Worksheet object
 * @param {Array} data - Array of data objects
 * @param {Array} headers - Array of header strings
 */
export const autoSizeColumns = (ws, data, headers) => {
    const colWidths = [];

    headers.forEach((header, colIndex) => {
        let maxWidth = header.length; // Start with header length

        // Check all data rows for this column
        data.forEach(row => {
            const col = Object.keys(row)[colIndex];
            const cellValue = row[col];
            const cellLength = cellValue ? String(cellValue).length : 0;
            maxWidth = Math.max(maxWidth, cellLength);
        });

        // Add padding and set constraints (min: 10, max: 50 characters)
        const width = Math.min(Math.max(maxWidth + 2, 10), 50);
        colWidths.push({ wch: width });
    });

    ws['!cols'] = colWidths;
    return ws;
};

// ==============================================
// FILENAME GENERATION
// ==============================================

/**
 * Generate dynamic filename based on report type and date
 * @param {string} reportType - Type of report (e.g., 'Invoice', 'Seller')
 * @param {string} section - Section name (e.g., 'BuyerWise', 'CompanyWise')
 * @param {Date} date - Report date (defaults to current date)
 */
export const generateFileName = (reportType, section, date = new Date()) => {
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Format: Invoice_Report_BuyerWise_Feb_2026.xlsx
    return `${reportType}_Report_${section}_${month}_${year}.xlsx`;
};

// ==============================================
// COMPLETE EXPORT FUNCTION
// ==============================================

/**
 * Complete export pipeline with all formatting
 * @param {Object} options - Export options
 * @param {Array} options.data - Data to export
 * @param {Array} options.columns - Column definitions
 * @param {Object} options.totals - Totals object (optional)
 * @param {string} options.sheetName - Sheet name
 * @param {string} options.fileName - Output filename
 * @param {string} options.reportTitle - Report title (optional)
 * @param {Array} options.conditionalFormatting - Conditional formatting rules (optional)
 */
export const exportToExcel = (options) => {
    try {
        const {
            data = [],
            columns = [],
            totals = null,
            sheetName = 'Report',
            fileName = 'Export.xlsx',
            reportTitle = null,
            conditionalFormatting = null
        } = options;

        // Validate required parameters
        if (!data || !Array.isArray(data)) {
            throw new Error('Data must be a non-empty array');
        }

        if (!columns || !Array.isArray(columns) || columns.length === 0) {
            throw new Error('Columns must be a non-empty array');
        }

        const wb = createStyledWorkbook();
        let ws = {};

        // Extract headers from columns array
        const headers = columns.map(col => col.label);

        // Add title rows (optional metadata)
        let currentRow = 0;
        if (reportTitle) {
            ws[XLSX.utils.encode_cell({ r: currentRow, c: 0 })] = {
                v: reportTitle,
                t: 's',
                s: {
                    font: { sz: 16, bold: true },
                    alignment: { horizontal: 'center' }
                }
            };
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: headers.length - 1 } });
            currentRow += 2;
        }

        // Add header row
        ws = addHeaderRow(ws, headers, currentRow);
        currentRow += 1;

        // Prepare conditional formatting function
        let conditionalFormattingFunc = null;
        if (conditionalFormatting && Array.isArray(conditionalFormatting)) {
            conditionalFormattingFunc = (row, columnKey) => {
                for (const rule of conditionalFormatting) {
                    if (rule.column === columnKey && rule.condition(row[columnKey])) {
                        return rule.style;
                    }
                }
                return null;
            };
        }

        // Add data rows
        if (data.length > 0) {
            ws = addDataRows(ws, data, columns, currentRow, {
                alternateRowColor: true,
                conditionalFormatting: conditionalFormattingFunc || createStatusConditionalFormat()
            });
            currentRow += data.length;
        }

        // Add totals row
        if (totals && Object.keys(totals).length > 0) {
            ws = addTotalsRow(ws, totals, columns, currentRow);
            currentRow += 1;
        }

        // Auto-size columns
        ws = autoSizeColumns(ws, data.length > 0 ? data : [{}], headers);

        // Set range
        if (!ws['!ref']) {
            ws['!ref'] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: { r: currentRow - 1, c: headers.length - 1 }
            });
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel sheet name limit is 31 chars

        // Write file
        XLSX.writeFile(wb, fileName);

        return { success: true, fileName };
    } catch (error) {
        console.error('Excel export error:', error);
        alert(`Export failed: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// ==============================================
// HELPER UTILITIES
// ==============================================

/**
 * Apply currency formatting
 */
export const applyCurrencyFormat = (value, currency = 'USD') => {
    if (currency === 'INR') {
        return {
            v: parseFloat(value),
            t: 'n',
            s: { numFmt: '₹#,##0.00' }
        };
    }
    return {
        v: parseFloat(value),
        t: 'n',
        s: { numFmt: '$#,##0.00' }
    };
};

/**
 * Apply date formatting
 */
export const applyDateFormat = (date) => {
    return {
        v: new Date(date),
        t: 'd',
        s: { numFmt: 'yyyy-mm-dd' }
    };
};
