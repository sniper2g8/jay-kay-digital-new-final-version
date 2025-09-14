const { getFirestoreInstance } = require('./utils');

const db = getFirestoreInstance();

async function checkAllCollectionsForSubcollections() {
    const collections = ['appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 'notification_preferences', 'pricingRules', 'services', 'settings'];
    
    try {
        console.log('Checking all collections for subcollections...\n');
        
        for (const collectionName of collections) {
            console.log(`=== ${collectionName} ===`);
            
            const snapshot = await db.collection(collectionName).limit(5).get(); // Check first 5 docs
            
            if (snapshot.empty) {
                console.log('  Collection is empty\n');
                continue;
            }
            
            let hasSubcollections = false;
            
            for (const doc of snapshot.docs) {
                const subcollections = await doc.ref.listCollections();
                
                if (subcollections.length > 0) {
                    hasSubcollections = true;
                    console.log(`  Document ${doc.id}:`);
                    for (const subcollection of subcollections) {
                        const subSnapshot = await subcollection.get();
                        console.log(`    - ${subcollection.id} (${subSnapshot.size} documents)`);
                    }
                }
            }
            
            if (!hasSubcollections) {
                console.log('  No subcollections found');
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Error checking subcollections:', error);
    }
}

// Run the check
checkAllCollectionsForSubcollections();
