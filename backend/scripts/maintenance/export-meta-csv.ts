import { exportMetadataToCSV } from '../../src/services/metadataService';

async function runExport() {
  console.log('📤 Exporting metadata to CSV...');
  
  try {
    await exportMetadataToCSV();
    console.log('✅ Export completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

runExport();