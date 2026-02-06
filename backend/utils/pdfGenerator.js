const PDFDocument = require('pdfkit');
const path = require('path');

exports.generateInvoicePDF = (invoice, items, res, layout = [], companyProfile = null) => {
    try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.id}.pdf"`);
        }

        doc.pipe(res);

        doc.on('error', (err) => {
            console.error("PDF Generation Error:", err);
            if (!res.headersSent) {
                res.status(500).send({ message: "Error generating PDF" });
            } else {
                res.end();
            }
        });

        const primaryColor = '#1e3a8a';
        const accentColor = '#ca8a04';
        const grayColor = '#4B5563';
        const lightGray = '#F9FAFB';

        doc.font('Helvetica');

        // --- Company Profile ---
        const companyName = companyProfile?.name || 'BALKRISHNA EXPORTS';
        const companyTagline = companyProfile?.tagline || 'Premium Diamond Exporters';
        const companyAddress = companyProfile?.address || 'Opera House, Mumbai, India';
        const companyContact = companyProfile?.contact || 'contact@balkrishnaexports.com';

        // --- Header ---
        doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(companyName, 40, 50);
        doc.fillColor(grayColor).fontSize(9).font('Helvetica')
            .text(companyTagline, 40, 75)
            .text(companyAddress, 40, 88)
            .text(companyContact, 40, 101);

        doc.fillColor('black').fontSize(24).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica')
            .text(`Invoice #: ${invoice.id}`, 400, 85, { align: 'right' })
            .text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 400, 100, { align: 'right' })
            .fillColor('green').text(`PAID`, 400, 115, { align: 'right' });

        // --- Bill To ---
        const billToTop = 160;
        const client = invoice.client;
        const billToHeight = client ? 100 : 70;
        doc.roundedRect(40, billToTop, 515, billToHeight, 5).fill(lightGray).stroke('#E5E7EB');

        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('BILL TO:', 55, billToTop + 15);
        let billY = billToTop + 30;
        doc.fillColor('black').font('Helvetica-Bold').fontSize(12).text(invoice.customer_name || 'Valued Customer', 55, billY);
        billY += 15;

        if (client) {
            doc.font('Helvetica').fontSize(9).fillColor(grayColor);
            if (client.company_name && client.company_name !== invoice.customer_name) { doc.text(client.company_name, 55, billY); billY += 12; }
            if (client.address) { doc.text(client.address, 55, billY, { width: 250 }); billY += 12; }
            const location = [client.city, client.country].filter(Boolean).join(', ');
            if (location) { doc.text(location, 55, billY); billY += 12; }

            const contactX = 320;
            let contactY = billToTop + 30;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('CONTACT:', contactX, contactY);
            contactY += 12;
            doc.font('Helvetica').fontSize(9).fillColor(grayColor);
            if (client.contact_number) doc.text(`Tel: ${client.contact_number}`, contactX, contactY);
            contactY += 12;
            if (client.email) doc.text(`Email: ${client.email}`, contactX, contactY, { width: 220 });
        }

        // --- Table ---
        const tableTop = client ? 280 : 250;

        const allColDefs = {
            no: { label: 'No.', w: 20, align: 'left', val: (d, i) => i + 1 },
            cert: { label: 'Certificate', w: 55, align: 'left', val: (d) => d.certificate, font: 'Helvetica-Bold' },
            shape: { label: 'Shape', w: 35, align: 'left', val: (d) => (d.shape || '').substr(0, 4).toUpperCase() },
            carat: { label: 'Carat', w: 30, align: 'left', val: (d) => d.carat || '-' },
            desc: { label: 'Carat', w: 30, align: 'left', val: (d) => d.carat || '-' }, // Legacy alias
            color: { label: 'Color', w: 25, align: 'left', val: (d) => d.color || '-' },
            clarity: { label: 'Clarity', w: 35, align: 'left', val: (d) => d.clarity || '-' },
            cut: { label: 'Cut', w: 25, align: 'left', val: (d) => (d.cut || '-').substr(0, 3) },
            pol: { label: 'Pol', w: 25, align: 'left', val: (d) => (d.polish || '-').substr(0, 3) },
            sym: { label: 'Sym', w: 25, align: 'left', val: (d) => (d.symmetry || '-').substr(0, 3) },
            dp: { label: 'Depth %', w: 35, align: 'left', val: (d) => d.total_depth_percent || '-' },
            tab: { label: 'Table %', w: 35, align: 'left', val: (d) => d.table_percent || '-' },

            // Financials - Use Client Currency (Billed)
            price_cts: {
                label: 'Rate/Ct', w: 60, align: 'right', val: (d, i, res) => {
                    const rate = res.item.billed_rate || res.item.rate_per_carat || 0;
                    return parseFloat(rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },

            amount: {
                label: 'Amount', w: 65, align: 'right', val: (d, i, res) => {
                    const amt = res.item.billed_amount || res.item.sale_price || 0;
                    return parseFloat(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },

            // Redundant alias
            sale_price: {
                label: 'Amount', w: 65, align: 'right', val: (d, i, res) => {
                    const amt = res.item.billed_amount || res.item.sale_price || 0;
                    return parseFloat(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }
        };

        // Determine Columns
        let activeColumns = [];
        if (layout && layout.length > 0) {
            if (typeof layout[0] === 'string') {
                // Remap legacy
                activeColumns = layout.map(key => {
                    const def = allColDefs[key];
                    return def ? { ...def, key } : null;
                });
            } else {
                activeColumns = layout.filter(l => l.visible !== false).map(l => {
                    const def = allColDefs[l.key];
                    if (!def) return null;
                    return { ...def, label: l.label || def.label, key: l.key };
                });
            }
        } else {
            const defaultKeys = ['no', 'cert', 'shape', 'carat', 'color', 'clarity', 'cut', 'pol', 'sym', 'dp', 'tab', 'price_cts', 'amount'];
            activeColumns = defaultKeys.map(key => ({ ...allColDefs[key], key }));
        }
        activeColumns = activeColumns.filter(Boolean);

        // Dynamic Spacing
        const totalW = activeColumns.reduce((sum, col) => sum + col.w, 0);
        const availableSpace = 515 - totalW;
        const spacing = Math.max(2, availableSpace / (activeColumns.length - 1 || 1));

        let currentX = 40;
        activeColumns.forEach(col => { col.x = currentX; currentX += col.w + spacing; });

        // Draw Header
        const drawTableHeader = (y) => {
            doc.rect(40, y, 515, 25).fill(primaryColor);
            doc.fillColor('white').font('Helvetica-Bold').fontSize(7);
            activeColumns.forEach(col => {
                doc.text(col.label, col.x, y + 8, { width: col.w, align: col.align === 'right' ? 'right' : 'left' });
            });
        };

        drawTableHeader(tableTop);

        let y = tableTop + 30;
        doc.fillColor('black').font('Helvetica').fontSize(7);

        items.forEach((item, i) => {
            const d = item.diamond;
            if (!d) return;

            const rowResults = { item: item };

            if (i % 2 === 0) doc.rect(40, y - 5, 515, 18).fill('#FAFAFA');

            doc.fillColor('black');
            activeColumns.forEach(col => {
                const text = col.val(d, i, rowResults);
                doc.font(col.font || 'Helvetica');
                doc.text(text, col.x, y, { width: col.w, align: col.align === 'right' ? 'right' : 'left' });
            });
            y += 18;

            if (y > 750) {
                doc.addPage();
                y = 50;
                drawTableHeader(y);
                y += 30;
                doc.fillColor('black').font('Helvetica').fontSize(7);
            }
        });

        // --- Totals ---
        y += 10;
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#E5E7EB').stroke();
        y += 15;

        const totalX_Labels = 350;
        const totalX_Vals = 450;

        // Show Subtotal and Grand Total in Client Currency
        const currencySymbol = invoice.currency === 'INR' ? '₹' : (invoice.currency === 'USD' ? '$' : invoice.currency);
        const finalAmount = invoice.grand_total || invoice.grand_total_usd;

        // Subtotal (if tax exists)
        if (invoice.total_gst > 0) {
            doc.font('Helvetica').fontSize(9).fillColor(grayColor);
            doc.text(`Subtotal`, totalX_Labels, y, { align: 'right' });
            doc.text(`${currencySymbol}${invoice.subtotal_amount}`, totalX_Vals, y, { align: 'right', width: 100 });
            y += 15;

            if (invoice.cgst_amount) {
                doc.text(`CGST (${invoice.cgst_rate}%)`, totalX_Labels, y, { align: 'right' });
                doc.text(`${currencySymbol}${invoice.cgst_amount}`, totalX_Vals, y, { align: 'right', width: 100 });
                y += 15;
            }
            if (invoice.sgst_amount) {
                doc.text(`SGST (${invoice.sgst_rate}%)`, totalX_Labels, y, { align: 'right' });
                doc.text(`${currencySymbol}${invoice.sgst_amount}`, totalX_Vals, y, { align: 'right', width: 100 });
                y += 15;
            }
        }

        doc.rect(totalX_Labels - 20, y - 5, 240, 30).fill(lightGray).stroke();
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12);
        doc.text('GRAND TOTAL', totalX_Labels, y + 5, { align: 'right' });
        doc.text(`${currencySymbol}${finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalX_Vals, y + 5, { align: 'right', width: 100 });

        // Footer
        const bottomY = 720;
        doc.fontSize(8).fillColor(grayColor).font('Helvetica');
        doc.text('Terms: Payment due upon receipt. Interest @ 18% p.a. on delayed payments.', 40, bottomY);
        doc.fillColor(accentColor).fontSize(8).text(`${companyName}`, 40, bottomY + 30, { align: 'center', width: 515 });

        doc.end();

    } catch (err) {
        console.error("PDF Generator Top-Level Error:", err);
        if (!res.headersSent) res.status(500).send({ message: "Failed to generate PDF." });
    }
};
