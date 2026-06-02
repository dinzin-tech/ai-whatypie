import pkg from 'bullmq';
const { Queue, Worker } = pkg;
import { createRedisConnection } from './redis-connection.js';

let _redisConnection = null;
let _dripQueue = null;
let _dripWorker = null;
let _isInitialized = false;
let _redisErrorLogged = false;

/** BullMQ custom jobId must not contain ':' */
export const buildDripJobId = (campaignId, contactId, stepIndex) =>
  `drip-${campaignId}-${contactId}-${stepIndex}`;

export const dripJobPrefix = (campaignId) => `drip-${campaignId}-`;

/** Legacy colon-based IDs (pre-fix); remove on pause/delete for migration */
export const legacyDripJobPrefix = (campaignId) => `drip:${campaignId}:`;

const runDripJobInline = async (data) => {
  const { processDripStepJob } = await import('../utils/drip-job-processor.js');
  return processDripStepJob(data);
};

const createStubQueue = () => ({
  add: async (name, data, opts = {}) => {
    console.warn('Redis not available. Running drip job synchronously:', name);
    if (opts.delay) {
      await new Promise((r) => setTimeout(r, Math.min(opts.delay, 60000)));
    }
    await runDripJobInline(data);
    return { id: opts.jobId || Math.random().toString(36).slice(2, 11) };
  },
  getJobs: async () => [],
  remove: async () => {}
});

const initializeQueueSystem = () => {
  if (_isInitialized) {
    return { queue: _dripQueue, worker: _dripWorker, redisConnection: _redisConnection };
  }

  try {
    _redisConnection = createRedisConnection();

    _dripQueue = new Queue('drip-campaign', {
      connection: _redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 60000
      }
    });

    _dripWorker = new Worker(
      'drip-campaign',
      async (job) => {
        console.log(`[Drip] job started ${job.id}`, job.data);
        const result = await runDripJobInline(job.data);
        return result;
      },
      {
        connection: _redisConnection,
        concurrency: 5
      }
    );

    _dripWorker.on('completed', (job, result) => {
      console.log(`[Drip] job completed ${job?.id}:`, result);
    });

    _dripWorker.on('failed', (job, err) => {
      console.error(`[Drip] job failed ${job?.id}:`, err.message);
    });

    _isInitialized = true;
  } catch (error) {
    if (!_redisErrorLogged) {
      console.error('Failed to connect drip queue to Redis:', error.message);
      _redisErrorLogged = true;
    }
    _dripQueue = createStubQueue();
    _dripWorker = null;
    _redisConnection = null;
    _isInitialized = true;
  }

  return { queue: _dripQueue, worker: _dripWorker, redisConnection: _redisConnection };
};

export const getDripCampaignQueue = () => {
  const { queue } = initializeQueueSystem();
  return queue;
};

export const getDripCampaignWorker = () => {
  const { worker } = initializeQueueSystem();
  return worker;
};

const jobMatchesCampaign = (jobId, campaignId) => {
  if (!jobId) return false;
  const id = String(jobId);
  return id.startsWith(dripJobPrefix(campaignId)) || id.startsWith(legacyDripJobPrefix(campaignId));
};

export const removeDripCampaignJobs = async (dripCampaignId) => {
  const queue = getDripCampaignQueue();
  if (!queue.getJobs) return;

  const jobs = await queue.getJobs(['delayed', 'waiting', 'paused', 'active']);
  for (const job of jobs) {
    if (jobMatchesCampaign(job.id, dripCampaignId)) {
      try {
        await job.remove();
      } catch (err) {
        console.warn(`Failed to remove drip job ${job.id}:`, err.message);
      }
    }
  }
};

const MIN_JOB_DELAY_MS = 2000;

const computeStepDelay = (enrolledAtMs, offsetMs) => {
  const raw = Math.max(0, enrolledAtMs + (offsetMs || 0) - Date.now());
  if (raw === 0) return MIN_JOB_DELAY_MS;
  return raw;
};

const isDuplicateJobError = (err) => {
  const msg = err?.message || '';
  return msg.includes('already exists') || msg.includes('JobId');
};

const addDripStepJob = async (queue, { campaign, dr, stepIndex, delay }) => {
  const contactIdStr = dr.contact_id.toString();
  const jobId = buildDripJobId(campaign._id.toString(), contactIdStr, stepIndex);

  try {
    await queue.add(
      'send_drip_step',
      {
        dripCampaignId: campaign._id.toString(),
        dripRecipientId: dr._id.toString(),
        stepIndex,
        userId: campaign.user_id.toString(),
        wabaId: campaign.waba_id.toString()
      },
      { delay, jobId }
    );
  } catch (err) {
    if (!isDuplicateJobError(err)) throw err;
  }
};

export const scheduleDripStepJobs = async ({ campaign, recipients, enrolledAtMs }) => {
  const queue = getDripCampaignQueue();
  const sortedSteps = [...campaign.steps].sort((a, b) => a.order - b.order);

  for (const dr of recipients) {
    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i];
      const delay = computeStepDelay(enrolledAtMs, step.offset_ms || 0);
      await addDripStepJob(queue, { campaign, dr, stepIndex: i, delay });
    }
  }
};

/** Re-queue only steps still pending (used on resume). */
export const schedulePendingDripStepJobs = async ({ campaign, recipients, enrolledAtMs }) => {
  const queue = getDripCampaignQueue();
  const sortedSteps = [...campaign.steps].sort((a, b) => a.order - b.order);

  for (const dr of recipients) {
    for (let i = 0; i < sortedSteps.length; i++) {
      const progress = dr.step_progress?.find((p) => p.step_index === i);
      if (progress && progress.status !== 'pending') continue;

      const delay = computeStepDelay(enrolledAtMs, sortedSteps[i].offset_ms || 0);
      await addDripStepJob(queue, { campaign, dr, stepIndex: i, delay });
    }
  }
};

export const countPendingDripSteps = (recipients, stepCount) => {
  let count = 0;
  for (const dr of recipients) {
    for (let i = 0; i < stepCount; i++) {
      const progress = dr.step_progress?.find((p) => p.step_index === i);
      if (!progress || progress.status === 'pending') count += 1;
    }
  }
  return count;
};

export default {
  getDripCampaignQueue,
  getDripCampaignWorker,
  removeDripCampaignJobs,
  scheduleDripStepJobs,
  schedulePendingDripStepJobs,
  countPendingDripSteps,
  buildDripJobId,
  dripJobPrefix
};
