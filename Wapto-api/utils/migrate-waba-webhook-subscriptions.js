import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../models/index.js';
import WhatsappWaba from '../models/whatsapp-waba.model.js';
import { subscribeWabaToWebhooks } from '../services/whatsapp/waba-subscription.service.js';

export async function runWabaWebhookSubscriptionMigration(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes('--dry-run');

  console.log(`[MIGRATION] Starting WABA Webhook Subscription Migration${isDryRun ? ' (DRY RUN MODE)' : ''}...`);

  let totalCount = 0;
  let alreadySubscribedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  const failures = [];

  try {
    await connectDB();

    const wabas = await WhatsappWaba.find({
      provider: 'business_api',
      deleted_at: null
    });

    totalCount = wabas.length;

    console.log(`[MIGRATION] Found ${totalCount} active Business API WABA record(s) in database.`);

    for (const waba of wabas) {
      const metaWabaId = waba.whatsapp_business_account_id;

      if (!metaWabaId || !waba.access_token) {
        console.warn(`[MIGRATION] Skipping WABA ${waba._id}: missing Meta WABA ID or access token.`);
        continue;
      }

      if (waba.webhook_subscription_status === 'subscribed') {
        alreadySubscribedCount++;
        continue;
      }

      if (isDryRun) {
        console.log(`[DRY RUN] Would subscribe WABA Mongo ID: ${waba._id}, Meta WABA ID: ${metaWabaId}`);
        successCount++;
        continue;
      }

      const result = await subscribeWabaToWebhooks({
        wabaMetaId: metaWabaId,
        accessToken: waba.access_token
      });

      if (result.success) {
        waba.webhook_subscription_status = 'subscribed';
        waba.webhook_subscribed_at = new Date();
        waba.webhook_subscription_error = null;
        await waba.save();
        successCount++;
      } else {
        waba.webhook_subscription_status = 'failed';
        waba.webhook_subscription_error = result.error;
        await waba.save();
        failedCount++;

        failures.push({
          mongoId: waba._id.toString(),
          metaWabaId: metaWabaId,
          error: result.error
        });
      }
    }

    console.log('\n==================================================');
    console.log(`WABA Webhook Subscription Migration Summary${isDryRun ? ' (DRY RUN)' : ''}`);
    console.log('==================================================');
    console.log(`Total WABAs: ${totalCount}`);
    console.log(`Already subscribed: ${alreadySubscribedCount}`);
    console.log(`Successfully subscribed: ${successCount}`);
    console.log(`Failed: ${failedCount}`);

    if (failures.length > 0) {
      console.log('\nFailed Subscriptions Breakdown:');
      failures.forEach((f, idx) => {
        console.log(`${idx + 1}. Mongo ID: ${f.mongoId} | Meta WABA ID: ${f.metaWabaId}`);
        console.log(`   Error: ${f.error}`);
      });
    }
    console.log('==================================================\n');

    await mongoose.connection.close();
    return {
      totalCount,
      alreadySubscribedCount,
      successCount,
      failedCount,
      failures
    };
  } catch (err) {
    console.error('[MIGRATION] Fatal migration error:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes('migrate-waba-webhook-subscriptions.js')) {
  runWabaWebhookSubscriptionMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
