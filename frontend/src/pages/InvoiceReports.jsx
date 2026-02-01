import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import ExcelGrid from '../components/ExcelGrid';
import ReportSectionNav from '../components/ReportSectionNav';
import SummaryTiles from '../components/SummaryTiles';
import { exportToExcel } from '../utils/excelFormatter';
import './InvoiceReports.css';

const InvoiceReports = () => {
    const [activeSection, setActiveSection] = useState('company');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Define report sections
    const sections = [
        { id: 'company', label: 'Company', icon: '🏢' },
        { id: 'buyer', label: 'Buyer', icon: '👤' },
        { id: 'staff', label: 'Staff', icon: '👨‍💼' },
        { id: 'date', label: 'Date', icon: '📅' },
        { id: 'currency', label: 'Currency', icon: '💱' },
        { id: 'gst', label: 'GST', icon: '🧾' }
    ];

    // Fetch report data based on active section
    useEffect(() => {
        fetchReportData(activeSection);
    }, [activeSection]);

    const fetchReportData = async (section) => {
        setLoading(true);
        setError(null);

        try {
            const endpoint = `/invoices/by-${section}`;
            const response = await api.get(endpoint);
            const data = response.data;

            // Handle GST report structure (has categories and totals)
            if (section === 'gst' && data.categories) {
                setReportData(data.categories);
            } else {
                setReportData(data);
            }
        } catch (err) {
            console.error('Report fetch error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch report');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    // Get column definitions based on active section
    const columns = useMemo(() => {
        const baseColumns = {
            company: [
                { key: 'company', label: 'Company Name', type: 'string' },
                { key: 'count', label: 'Invoices', type: 'number' },
                { key: 'totalAmount', label: 'Total Amount', type: 'currency', currency: 'USD' },
                { key: 'totalPaid', label: 'Paid', type: 'currency', currency: 'USD' },
                { key: 'totalDue', label: 'Due', type: 'currency', currency: 'USD' }
            ],
            buyer: [
                { key: 'buyer', label: 'Buyer Name', type: 'string' },
                { key: 'count', label: 'Invoices', type: 'number' },
                { key: 'totalAmount', label: 'Total Amount', type: 'currency', currency: 'USD' },
                { key: 'totalPaid', label: 'Paid', type: 'currency', currency: 'USD' },
                { key: 'totalDue', label: 'Due', type: 'currency', currency: 'USD' }
            ],
            staff: [
                { key: 'staffName', label: 'Staff Member', type: 'string' },
                { key: 'count', label: 'Invoices', type: 'number' },
                { key: 'totalAmount', label: 'Total Amount', type: 'currency', currency: 'USD' },
                { key: 'totalPaid', label: 'Paid', type: 'currency', currency: 'USD' },
                { key: 'totalDue', label: 'Due', type: 'currency', currency: 'USD' },
                { key: 'totalProfit', label: 'Profit', type: 'currency', currency: 'USD' }
            ],
            date: [
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'count', label: 'Invoices', type: 'number' },
                { key: 'totalAmount', label: 'Total Amount', type: 'currency', currency: 'USD' },
                { key: 'totalPaid', label: 'Paid', type: 'currency', currency: 'USD' },
                { key: 'totalDue', label: 'Due', type: 'currency', currency: 'USD' },
                { key: 'totalProfit', label: 'Profit', type: 'currency', currency: 'USD' }
            ],
            currency: [
                { key: 'currency', label: 'Currency', type: 'string' },
                { key: 'count', label: 'Invoices', type: 'number' },
                { key: 'totalAmount', label: 'Total Amount', type: 'currency', currency: 'USD' },
                { key: 'totalPaid', label: 'Paid', type: 'currency', currency: 'USD' },
                { key: 'totalDue', label: 'Due', type: 'currency', currency: 'USD' },
                { key: 'totalProfit', label: 'Profit (USD)', type: 'currency', currency: 'USD' }
            ],
            gst: [
                { key: 'gstCategory', label: 'GST Category', type: 'string' },
                { key: 'count', label: 'Invoices', type: 'number' },
                { key: 'totalSubtotal', label: 'Subtotal', type: 'currency', currency: 'INR' },
                { key: 'totalCGST', label: 'CGST', type: 'currency', currency: 'INR' },
                { key: 'totalSGST', label: 'SGST', type: 'currency', currency: 'INR' },
                { key: 'totalGST', label: 'Total GST', type: 'currency', currency: 'INR' },
                { key: 'totalGrandTotal', label: 'Grand Total', type: 'currency', currency: 'INR' }
            ]
        };

        return baseColumns[activeSection] || [];
    }, [activeSection]);

    // Calculate summary tiles data
    const summaryTiles = useMemo(() => {
        if (!reportData || reportData.length === 0) return [];

        const totalInvoices = reportData.reduce((sum, row) => sum + (row.count || 0), 0);
        const totalAmount = reportData.reduce((sum, row) => sum + (row.totalAmount || row.totalGrandTotal || 0), 0);
        const totalPaid = reportData.reduce((sum, row) => sum + (row.totalPaid || 0), 0);
        const totalDue = reportData.reduce((sum, row) => sum + (row.totalDue || 0), 0);

        const tiles = [
            {
                id: 'total',
                label: 'Total Amount',
                value: totalAmount,
                type: 'currency',
                currency: activeSection === 'gst' ? 'INR' : 'USD',
                icon: '💰',
                iconBg: '#E8F0FE',
                variant: 'total'
            },
            {
                id: 'records',
                label: 'Total Invoices',
                value: totalInvoices,
                type: 'number',
                icon: '📄',
                iconBg: '#F3E8FF',
                variant: 'records'
            }
        ];

        if (activeSection !== 'gst') {
            tiles.push(
                {
                    id: 'paid',
                    label: 'Paid Amount',
                    value: totalPaid,
                    type: 'currency',
                    currency: 'USD',
                    icon: '✅',
                    iconBg: '#D1FAE5',
                    variant: 'paid'
                },
                {
                    id: 'due',
                    label: 'Due Amount',
                    value: totalDue,
                    type: 'currency',
                    currency: 'USD',
                    icon: '⏰',
                    iconBg: '#FEE2E2',
                    variant: 'due'
                }
            );
        }

        return tiles;
    }, [reportData, activeSection]);

    // Calculate totals row
    const totals = useMemo(() => {
        if (!reportData || reportData.length === 0) return null;

        const totalsObj = {};

        columns.forEach(col => {
            if (col.type === 'currency' || col.type === 'number') {
                totalsObj[col.key] = reportData.reduce((sum, row) => sum + (parseFloat(row[col.key]) || 0), 0);
            }
        });

        return totalsObj;
    }, [reportData, columns]);

    // Conditional row coloring
    const conditionalRowColor = (row) => {
        if (row.totalDue > 0 || row.balance_due > 0) {
            return 'row-overdue';
        }
        if (row.totalDue === 0 && row.totalPaid > 0) {
            return 'row-paid';
        }
        return '';
    };

    // Export to Excel
    const handleExport = () => {
        if (!reportData || reportData.length === 0) {
            alert('No data to export');
            return;
        }

        // Prepare section-specific data
        const sectionLabels = {
            company: 'Company Wise',
            buyer: 'Buyer Wise',
            staff: 'Staff Wise',
            date: 'Date Wise',
            currency: 'Currency Wise',
            gst: 'GST Report'
        };

        const sheetName = sectionLabels[activeSection] || 'Report';

        // Export with professional formatting
        exportToExcel({
            data: reportData,
            columns: columns,
            totals: totals,
            sheetName: sheetName,
            fileName: `Invoice_Report_${activeSection}_${new Date().toISOString().split('T')[0]}`,
            reportTitle: `Invoice Report - ${sectionLabels[activeSection]}`,
            conditionalFormatting: activeSection !== 'gst' ? [
                {
                    column: 'totalDue',
                    condition: (value) => value > 0,
                    style: {
                        font: { color: { rgb: 'B91C1C' }, bold: true },
                        fill: { fgColor: { rgb: 'FEE2E2' } }
                    }
                }
            ] : []
        });
    };

    return (
        <div className="invoice-reports-page">
            <div className="reports-header">
                <div className="header-content">
                    <h1>Invoice Reports</h1>
                    <p className="header-subtitle">Section-wise analysis and insights</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export" onClick={handleExport}>
                        <span>📥</span>
                        Export to Excel
                    </button>
                </div>
            </div>

            <ReportSectionNav
                sections={sections}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />

            {error && (
                <div className="error-message">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {!error && (
                <>
                    <SummaryTiles tiles={summaryTiles} />

                    <div className="report-grid-container">
                        <ExcelGrid
                            data={reportData}
                            columns={columns}
                            totals={totals}
                            loading={loading}
                            conditionalRowColor={conditionalRowColor}
                            emptyMessage={`No ${activeSection} data available`}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default InvoiceReports;
