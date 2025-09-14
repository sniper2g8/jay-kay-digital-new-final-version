const { getFirestoreInstance } = require('./utils');
const fs = require('fs');

const db = getFirestoreInstance();

async function exportInvoicePayments() {
    try {
        console.log('Starting export of invoice payments subcollection...');
        
        // Get all invoices first
        const invoicesSnapshot = await db.collection('invoices').get();
        const allPayments = [];
        
        for (const invoiceDoc of invoicesSnapshot.docs) {
            const invoiceId = invoiceDoc.id;
            const invoiceData = invoiceDoc.data();
            
            console.log(`Processing payments for invoice: ${invoiceData.invoiceNo || invoiceId}`);
            
            // Get the 'payments' subcollection for this invoice
            const paymentsSnapshot = await db.collection('invoices')
                .doc(invoiceId)
                .collection('payments')
                .get();
            
            // Process each payment
            paymentsSnapshot.forEach(paymentDoc => {
                const paymentData = paymentDoc.data();
                
                // Add reference information
                paymentData.firestore_id = paymentDoc.id;
                paymentData.invoice_id = invoiceId;
                paymentData.invoice_no = invoiceData.invoiceNo || null;
                
                allPayments.push(paymentData);
                console.log(`  - Found payment: ${paymentData.firestore_id}`);
            });
        }
        
        // Write all payments to JSON file
        const outputFile = './invoice_payments.json';
        fs.writeFileSync(outputFile, JSON.stringify(allPayments, null, 2));
        
        console.log(`\nExport completed!`);
        console.log(`${allPayments.length} payment records written to ${outputFile}`);
        
    } catch (error) {
        console.error('Error exporting invoice payments:', error);
    }
}

// Run the export
exportInvoicePayments();
