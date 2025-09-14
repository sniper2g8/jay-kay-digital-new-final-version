const { getFirestoreInstance } = require('./utils');

const db = getFirestoreInstance();

async function listSubcollections() {
    try {
        console.log('Checking for subcollections in invoices...');
        
        // Get all invoices
        const invoicesSnapshot = await db.collection('invoices').get();
        
        for (const invoiceDoc of invoicesSnapshot.docs) {
            const invoiceId = invoiceDoc.id;
            const invoiceData = invoiceDoc.data();
            
            console.log(`\nInvoice: ${invoiceData.invoiceNo || invoiceId}`);
            
            // List all subcollections for this document
            const subcollections = await invoiceDoc.ref.listCollections();
            
            if (subcollections.length > 0) {
                console.log(`  Subcollections found:`);
                for (const subcollection of subcollections) {
                    console.log(`    - ${subcollection.id}`);
                    
                    // Get count of documents in this subcollection
                    const subSnapshot = await subcollection.get();
                    console.log(`      (${subSnapshot.size} documents)`);
                }
            } else {
                console.log(`  No subcollections found`);
            }
        }
        
    } catch (error) {
        console.error('Error listing subcollections:', error);
    }
}

// Run the check
listSubcollections();
