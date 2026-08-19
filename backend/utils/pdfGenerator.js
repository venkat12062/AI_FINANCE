const PDFDocument = require('pdfkit');

const generatePDF = (transactions, summary, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // 1. Title
            doc.fontSize(20).font('Helvetica-Bold').text('AI Finance Manager Report', { align: 'center' });
            doc.moveDown();
            
            // 2. Report Period
            doc.fontSize(12).font('Helvetica').text(`Report Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, { align: 'center' });
            doc.moveDown(2);

            // 3. Financial Summary
            doc.fontSize(16).font('Helvetica-Bold').text('Financial Summary');
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            doc.text(`Total Income: INR ${parseFloat(summary.totalIncome).toLocaleString('en-IN')}`, { indent: 20 });
            doc.text(`Total Expense: INR ${parseFloat(summary.totalExpense).toLocaleString('en-IN')}`, { indent: 20 });
            doc.text(`Net Savings: INR ${parseFloat(summary.netSavings).toLocaleString('en-IN')}`, { indent: 20 });
            doc.text(`Transaction Count: ${summary.transactionCount}`, { indent: 20 });
            doc.moveDown(2);

            // 4. Transaction Table Header
            doc.fontSize(16).font('Helvetica-Bold').text('Transaction Details');
            doc.moveDown(0.5);
            
            // Table Layout
            const tableTop = doc.y;
            const columnX = [50, 130, 230, 300, 380]; // Date, Category, Type, Amount, Desc
            
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Date', columnX[0], tableTop);
            doc.text('Category', columnX[1], tableTop);
            doc.text('Type', columnX[2], tableTop);
            doc.text('Amount (INR)', columnX[3], tableTop);
            doc.text('Description', columnX[4], tableTop);
            
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            
            // 5. Transaction Rows
            let yPosition = tableTop + 20;
            doc.font('Helvetica');

            transactions.forEach(t => {
                // Add new page if close to bottom
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50; // reset to top
                }

                doc.text(new Date(t.transaction_date).toLocaleDateString('en-IN'), columnX[0], yPosition);
                doc.text(t.category_name.substring(0, 15), columnX[1], yPosition);
                doc.text(t.type, columnX[2], yPosition);
                doc.text('Rs. ' + parseFloat(t.amount).toLocaleString('en-IN'), columnX[3], yPosition);
                
                const desc = t.description ? t.description.substring(0, 30) : 'N/A';
                doc.text(desc, columnX[4], yPosition);

                yPosition += 20;
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generatePDF
};
