import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { emitToAll } from '../config/socket';
import { exportMetadataToCSV } from './metadataService';

const execAsync = promisify(exec);

export const initializeScheduler = () => {
  console.log('📅 Initializing task scheduler...');

  // Every 5 minutes: Update timeout records and ingest data
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running data ingestion...');
    try {
      // Run Python timeout script
      await execAsync('python scripts/data-processing/timeout.py');
      
      // Run TypeScript ingest and transform
      await execAsync('npm run ingest');
      await execAsync('npm run transform');

      // Notify connected clients
      emitToAll('data-updated', { timestamp: new Date() });
      
      console.log('✅ Data ingestion completed');
    } catch (error) {
      console.error('❌ Data ingestion failed:', error);
    }
  });

  // Every hour: Export meta.csv backup
  cron.schedule('0 * * * *', async () => {
    console.log('Exporting meta.csv backup...');
    try {
      await exportMetadataToCSV();
      console.log('✅ Meta.csv exported');
    } catch (error) {
      console.error('❌ Meta.csv export failed:', error);
    }
  });

  // Every day at midnight: Cleanup old audit logs (keep last 90 days)
  cron.schedule('0 0 * * *', async () => {
    console.log('Cleaning up old audit logs...');
    try {
      const { query } = await import('../config/database');
      await query(
        `DELETE FROM audit_log 
         WHERE created_at < NOW() - INTERVAL '90 days'`
      );
      console.log('✅ Audit logs cleaned');
    } catch (error) {
      console.error('❌ Audit cleanup failed:', error);
    }
  });

  console.log('✅ Scheduler initialized');
};