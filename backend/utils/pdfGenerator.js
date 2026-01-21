const PDFDocument = require('pdfkit');
const path = require('path');

exports.generateInvoicePDF = (invoice, items, res) => {
    try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/pdf');
            // Inline ensures it opens in browser instead of downloading
            res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.id}.pdf"`);
        }

        doc.pipe(res);

        // Error handling for the document stream
        doc.on('error', (err) => {
            console.error("PDF Generation Error:", err);
            if (!res.headersSent) {
                res.status(500).send({ message: "Error generating PDF" });
            } else {
                res.end(); // Ensure response is closed
            }
        });

        // --- Resources ---
        const logoPath = path.join(__basedir, "public", "logo.png");

        // --- Colors & Fonts ---
        const primaryColor = '#1e3a8a'; // Navy Blue (Balkrishna)
        const accentColor = '#ca8a04';  // Gold
        const grayColor = '#4B5563';
        const lightGray = '#F9FAFB';

        doc.font('Helvetica');

        // --- Header Section ---
        // Logo (Left)
        if (path) {
            try {
                doc.image(logoPath, 40, 40, { width: 80 });
            } catch (e) {
                // Fallback text if logo missing
            }
        }

        // Company Name
        doc.fillColor(primaryColor)
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('BALKRISHNA EXPORTS', 130, 50);

        doc.fillColor(grayColor)
            .fontSize(9)
            .font('Helvetica')
            .text('Premium Diamond Exporters', 130, 75)
            .text('Opera House, Mumbai, India', 130, 88)
            .text('contact@balkrishnaexports.com', 130, 101);

        // Invoice Meta (Right)
        doc.fillColor('black')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('INVOICE', 400, 50, { align: 'right' });

        doc.fontSize(10)
            .font('Helvetica')
            .text(`Invoice #: ${invoice.id}`, 400, 85, { align: 'right' })
            .text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 400, 100, { align: 'right' })
            .fillColor('green')
            .text(`PAID`, 400, 115, { align: 'right' });

        doc.moveDown(4);

        // --- Bill To Section ---
        const billToTop = 160;
        doc.roundedRect(40, billToTop, 515, 60, 5).fill(lightGray).stroke('#E5E7EB');

        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10)
            .text('BILL TO:', 55, billToTop + 15);

        doc.fillColor('black').font('Helvetica-Bold').fontSize(12)
            .text(invoice.customer_name || 'Valued Customer', 55, billToTop + 30);

        // --- Table Header ---
        const tableTop = 250;
        // Columns: No, Desc, Cert, Shape, Color, Clarity, BasePrice, Disc, Net
        // X Positions
        const xNo = 40;
        const xDesc = 70;
        const xCert = 180;
        const xShape = 240;
        const xColor = 280;
        const xClarity = 310;
        const xBase = 350;
        const xDisc = 410;
        const xNet = 470;

        const drawTableHeader = (y) => {
            doc.rect(40, y, 515, 25).fill(primaryColor);
            doc.fillColor('white').font('Helvetica-Bold').fontSize(8);

            doc.text('#', xNo + 2, y + 8);
            doc.text('DESCRIPTION', xDesc, y + 8);
            doc.text('CERT NO', xCert, y + 8);
            doc.text('SHP', xShape, y + 8);
            doc.text('COL', xColor, y + 8);
            doc.text('CLR', xClarity, y + 8);
            doc.text('BASE ($)', xBase, y + 8, { width: 50, align: 'right' });
            doc.text('DISC %', xDisc, y + 8, { width: 40, align: 'right' });
            doc.text('NET ($)', xNet, y + 8, { width: 60, align: 'right' });
        };

        drawTableHeader(tableTop);

        // --- Table Rows ---
        let y = tableTop + 30;
        let totalBase = 0;

        doc.fillColor('black').font('Helvetica').fontSize(9);

        items.forEach((item, i) => {
            const d = item.diamond;
            if (!d) return;

            // Calculations
            // item.sale_price is final "Net Price" (Total)
            // We need to reverse calc Base for display if not present
            const netPrice = parseFloat(item.sale_price);

            const disc = parseFloat(d.discount) || 0;
            let basePrice = netPrice;
            if (disc > 0 && disc < 100) {
                basePrice = netPrice / (1 - disc / 100);
            }

            totalBase += basePrice;

            // Striping
            if (i % 2 === 0) doc.rect(40, y - 5, 515, 20).fill('#FAFAFA');

            doc.fillColor('black');
            doc.text(i + 1, xNo + 2, y);
            doc.text(`${d.carat}ct Diamond`, xDesc, y);
            doc.font('Helvetica-Bold').text(d.certificate, xCert, y);
            doc.font('Helvetica').text(d.shape, xShape, y);
            doc.text(d.color, xColor, y);
            doc.text(d.clarity, xClarity, y);

            doc.text(basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), xBase, y, { width: 50, align: 'right' });
            doc.text(`${disc.toFixed(2)}%`, xDisc, y, { width: 40, align: 'right' });
            doc.font('Helvetica-Bold').text(netPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), xNet, y, { width: 60, align: 'right' });

            y += 20;

            // Page break check (simple)
            if (y > 750) {
                doc.addPage();
                y = 50;
                drawTableHeader(y);
                y += 30; // Space after header
                doc.fillColor('black').font('Helvetica').fontSize(9);
            }
        });

        // --- Footer / Totals ---
        y += 10;
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#E5E7EB').stroke();
        y += 15;

        // Totals Section (Right)
        const totalX_Labels = 350;
        const totalX_Vals = 450;

        doc.font('Helvetica').fontSize(10); // Totals don't need to be huge

        doc.fillColor(grayColor).text('Total Base Amount:', totalX_Labels, y, { align: 'right' });
        doc.fillColor('black').text(`$${totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalX_Vals, y, { align: 'right', width: 100 });
        y += 15;

        // Avg Disc
        const avgDisc = ((1 - (invoice.total_amount / totalBase)) * 100) || 0;
        doc.fillColor(grayColor).text('Avg Discount:', totalX_Labels, y, { align: 'right' });
        doc.fillColor('red').text(`${avgDisc.toFixed(2)}%`, totalX_Vals, y, { align: 'right', width: 100 });
        y += 20;

        // Grand Total
        doc.rect(totalX_Labels - 20, y - 5, 240, 30).fill(lightGray).stroke();
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12);
        doc.text('GRAND TOTAL', totalX_Labels, y + 5, { align: 'right' });
        doc.text(`$${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalX_Vals, y + 5, { align: 'right', width: 100 });

        // Terms (Bottom Left)
        const bottomY = 720;
        doc.fontSize(8).fillColor(grayColor);
        doc.text('Thank you for your business!', 40, bottomY);
        doc.text('Terms & Conditions: Returns accepted within 7 days. Payment due upon receipt.', 40, bottomY + 12);

        // Branding Footer
        doc.fillColor(accentColor).fontSize(8).text('Balkrishna Exports - Excellence in Every Facet', 40, bottomY + 30, { align: 'center', width: 515 });

        doc.end();

    } catch (err) {
        console.error("PDF Generator Top-Level Error:", err);
        if (!res.headersSent) {
            res.status(500).send({ message: "Failed to generate PDF." });
        }
    }
};
