import { cleanDefaultMetadata } from '../../src/services/metadataService';

async function runCleanup() {
  console.log('🧹 Cleaning default metadata...');
  
  try {
    const cleaned = await cleanDefaultMetadata();
    console.log(`✅ Cleaned ${cleaned.length} default entries`);
    cleaned.forEach(entry => {
      console.log(`  - ${entry.test_name}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup();