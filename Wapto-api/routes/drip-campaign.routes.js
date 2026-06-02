import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireSubscription, checkPlanLimit } from '../middlewares/plan-permission.js';
import { checkPermission } from '../middlewares/permission.js';
import {
  createDripCampaign,
  getDripCampaigns,
  getDripCampaignById,
  updateDripCampaign,
  deleteDripCampaign,
  previewDripAudience,
  activateDripCampaign,
  pauseDripCampaign,
  resumeDripCampaign,
  retryPendingDripCampaign
} from '../controllers/drip-campaign.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(requireSubscription);

router.post('/', checkPlanLimit('campaigns'), checkPermission('create.campaigns'), createDripCampaign);
router.get('/', checkPermission('view.campaigns'), getDripCampaigns);
router.get('/:id', checkPermission('view.campaigns'), getDripCampaignById);
router.put('/:id', checkPermission('update.campaigns'), updateDripCampaign);
router.delete('/:id', checkPermission('delete.campaigns'), deleteDripCampaign);
router.post('/:id/preview-audience', checkPermission('view.campaigns'), previewDripAudience);
router.post('/:id/activate', checkPlanLimit('campaigns'), checkPermission('create.campaigns'), activateDripCampaign);
router.post('/:id/pause', checkPermission('create.campaigns'), pauseDripCampaign);
router.post('/:id/resume', checkPermission('create.campaigns'), resumeDripCampaign);
router.post('/:id/retry-pending', checkPermission('create.campaigns'), retryPendingDripCampaign);

export default router;
