/**
 * GST Constants for Invoice Billing
 * 
 * These rates are used for calculating GST on diamond sales
 * CGST + SGST = Total GST (Intrastate transactions)
 * IGST = Total GST (Interstate transactions)
 */

module.exports = {
    // GST Rates (in percentage)
    CGST_RATE: 0.75,  // Central GST
    SGST_RATE: 0.75,  // State GST
    IGST_RATE: 1.5,   // Integrated GST (for interstate, future use)

    // Total GST Rate
    TOTAL_GST_RATE: 1.5, // CGST + SGST

    // Company GST Number (Update with actual GST number)
    COMPANY_GST_NUMBER: "27AABCU9603R1ZM", // Placeholder - Maharashtra GST format

    // Company Details for Invoice
    COMPANY_NAME: "Balkrishna Exports",
    COMPANY_ADDRESS: "Opera House, Mumbai, India",
    COMPANY_EMAIL: "contact@balkrishnaexports.com",
    COMPANY_PHONE: "+91 98765 43210"
};
