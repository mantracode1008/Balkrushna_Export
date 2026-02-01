import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import ExcelGrid from '../components/ExcelGrid';
import ReportSectionNav from '../components/ReportSectionNav';
import SummaryTiles from '../components/SummaryTiles';
import { exportToExcel } from '../utils/excelFormatter';
import './SellerReports.css';

const SellerReports = () => {
    const [activeSection, setActiveSection] = useState('purchases');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Define report sections
    const sections = [
        { id: 'purchases', label: 'Purchases', icon: '💎' },
        { id: 'payments', label: 'Payments', icon: '💳' },
        { id: 'overdue', label: 'Overdue', icon: '⚠️' }
    ];

    // Fetch report data based on active section
    useEffect(() => {
        fetchReportData(activeSection);
    }, [activeSection]);

    const fetchReportData = async (section) => {
        setLoading(true);
        setError(null);

        try {
            const endpoint = `/sellers/${section}`;
            const response = await api.get(endpoint);
            const data = response.data;

            setReportData(data);
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
            purchases: [
                { key: 'name', label: 'Seller Name', type: 'string' },
                { key: 'company', label: 'Company', type: 'string' },
                { key: 'mobile', label: 'Mobile', type: 'string' },
                { key: 'diamondCount', label: 'Diamonds', type: 'number' },
                { key: 'totalPurchased', label: 'Total Purchased', type: 'currency', currency: 'USD' },
                { key: 'totalPaid', label: 'Total Paid', type: 'currency', currency: 'USD' },
                { key: 'totalDue', label: 'Total Due', type: 'currency', currency: 'USD' }
            ],
            payments: [
                { key: 'seller.name', label: 'Seller Name', type: 'string' },
                { key: 'seller.company', label: 'Company', type: 'string' },
                { key: 'seller.mobile', label: 'Mobile', type: 'string' },
                { key: 'paymentCount', label: 'Payments Made', type: 'number' },
                { key: 'totalPayments', label: 'Total Paid', type: 'currency', currency: 'USD' }
            ],
            overdue: [
                { key: 'seller.name', label: 'Seller Name', type: 'string' },
                { key: 'seller.company', label: 'Company', type: 'string' },
                { key: 'seller.mobile', label: 'Mobile', type: 'string' },
                { key: 'seller.email', label: 'Email', type: 'string' },
                { key: 'count', label: 'Overdue Items', type: 'number' },
                { key: 'totalOverdue', label: 'Amount Overdue', type: 'currency', currency: 'USD' }
            ]
        };

        return baseColumns[activeSection] || [];
    }, [activeSection]);

    // Transform data for nested properties
    const transformedData = useMemo(() => {
        return reportData.map(row => {
            const transformed = { ...row };

            // Handle nested seller properties for payments and overdue sections
            if (activeSection === 'payments' || activeSection === 'overdue') {
                if (row.seller) {
                    transformed['seller.name'] = row.seller.name;
                    transformed['seller.company'] = row.seller.company;
                    transformed['seller.mobile'] = row.seller.mobile;
                    transformed['seller.email'] = row.seller.email;
                }
            }

            return transformed;
        });
    }, [reportData, activeSection]);

    // Calculate summary tiles data
    const summaryTiles = useMemo(() => {
        if (!reportData || reportData.length === 0) return [];

        if (activeSection === 'purchases') {
            const totalPurchased = reportData.reduce((sum, row) => sum + (row.totalPurchased || 0), 0);
            const totalPaid = reportData.reduce((sum, row) => sum + (row.totalPaid || 0), 0);
            const totalDue = reportData.reduce((sum, row) => sum + (row.totalDue || 0), 0);
            const totalDiamonds = reportData.reduce((sum, row) => sum + (row.diamondCount || 0), 0);

            return [
                {
                    id: 'total',
                    label: 'Total Purchased',
                    value: totalPurchased,
                    type: 'currency',
                    currency: 'USD',
                    icon: '💎',
                    iconBg: '#E8F0FE',
                    variant: 'total'
                },
                {
                    id: 'paid',
                    label: 'Total Paid',
                    value: totalPaid,
                    type: 'currency',
                    currency: 'USD',
                    icon: '✅',
                    iconBg: '#D1FAE5',
                    variant: 'paid'
                },
                {
                    id: 'due',
                    label: 'Total Due',
                    value: totalDue,
                    type: 'currency',
                    currency: 'USD',
                    icon: '⏰',
                    iconBg: '#FEE2E2',
                    variant: 'due'
                },
                {
                    id: 'diamonds',
                    label: 'Total Diamonds',
                    value: totalDiamonds,
                    type: 'number',
                    icon: '💍',
                    iconBg: '#F3E8FF',
                    variant: 'records'
                }
            ];
        } else if (activeSection === 'payments') {
            const totalPayments = reportData.reduce((sum, row) => sum + (row.totalPayments || 0), 0);
            const paymentCount = reportData.reduce((sum, row) => sum + (row.paymentCount || 0), 0);

            return [
                {
                    id: 'total',
                    label: 'Total Payments',
                    value: totalPayments,
                    type: 'currency',
                    currency: 'USD',
                    icon: '💰',
                    iconBg: '#E8F0FE',
                    variant: 'total'
                },
                {
                    id: 'count',
                    label: 'Payment Transactions',
                    value: paymentCount,
                    type: 'number',
                    icon: '📄',
                    iconBg: '#D1FAE5',
                    variant: 'records'
                },
                {
                    id: 'sellers',
                    label: 'Sellers with Payments',
                    value: reportData.length,
                    type: 'number',
                    icon: '👥',
                    iconBg: '#FEF3C7',
                    variant: 'pending'
                }
            ];
        } else if (activeSection === 'overdue') {
            const totalOverdue = reportData.reduce((sum, row) => sum + (row.totalOverdue || 0), 0);
            const overdueItems = reportData.reduce((sum, row) => sum + (row.count || 0), 0);

            return [
                {
                    id: 'total',
                    label: 'Total Overdue',
                    value: totalOverdue,
                    type: 'currency',
                    currency: 'USD',
                    icon: '⚠️',
                    iconBg: '#FEE2E2',
                    variant: 'due'
                },
                {
                    id: 'items',
                    label: 'Overdue Items',
                    value: overdueItems,
                    type: 'number',
                    icon: '📋',
                    iconBg: '#FEF3C7',
                    variant: 'pending'
                },
                {
                    id: 'sellers',
                    label: 'Sellers with Overdue Payments',
                    value: reportData.length,
                    type: 'number',
                    icon: '🏢',
                    iconBg: '#FFE4E6',
                    variant: 'due'
                }
            ];
        }

        return [];
    }, [reportData, activeSection]);

    // Calculate totals row
    const totals = useMemo(() => {
        if (!transformedData || transformedData.length === 0) return null;

        const totalsObj = {};

        columns.forEach(col => {
            if (col.type === 'currency' || col.type === 'number') {
                totalsObj[col.key] = transformedData.reduce((sum, row) => sum + (parseFloat(row[col.key]) || 0), 0);
            }
        });

        return totalsObj;
    }, [transformedData, columns]);

    // Conditional row coloring
    const conditionalRowColor = (row) => {
        if (activeSection === 'overdue') {
            return 'row-overdue';
        }
        if (activeSection === 'purchases' && row.totalDue > 0) {
            return 'row-pending';
        }
        if (activeSection === 'purchases' && row.totalDue === 0 && row.totalPaid > 0) {
            return 'row-paid';
        }
        return '';
    };

    // Export to Excel
    const handleExport = () => {
        if (!transformedData || transformedData.length === 0) {
            alert('No data to export');
            return;
        }

        // Prepare section-specific data
        const sectionLabels = {
            purchases: 'Purchases',
            payments: 'Payments',
            overdue: 'Overdue Payments'
        };

        const sheetName = sectionLabels[activeSection] || 'Report';

        // Export with professional formatting
        exportToExcel({
            data: transformedData,
            columns: columns,
            totals: totals,
            sheetName: sheetName,
            fileName: `Seller_Report_${activeSection}_${new Date().toISOString().split('T')[0]}`,
            reportTitle: `Seller Report - ${sectionLabels[activeSection]}`,
            conditionalFormatting: activeSection === 'overdue' || (activeSection === 'purchases') ? [
                {
                    column: activeSection === 'overdue' ? 'totalOverdue' : 'totalDue',
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
        <div className="seller-reports-page">
            <div className="reports-header">
                <div className="header-content">
                    <h1>Seller Reports</h1>
                    <p className="header-subtitle">Track purchases, payments, and outstanding balances</p>
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
                            data={transformedData}
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

export default SellerReports;
