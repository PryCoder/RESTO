import express from 'express';
import {
  getUpsellSuggestions,
  analyzePlate,
  predictCrowd,
  adjustMenuPrices,
  handleVoiceOrder,
  customerallergy,
  createSchedule
} from '../controllers/aiController.js';
import { inventoryWasteAlert, salesProfitAdvisor, slowHourAnalyzer, smartLeftoverReuse } from '../services/geminiService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// AI upsell suggestions
router.get('/upsell', authMiddleware, getUpsellSuggestions);

// AI plate analysis
router.post('/plate', authMiddleware, analyzePlate);

// AI crowd prediction
router.get('/crowd', authMiddleware, predictCrowd);

router.post('/adjust-prices', authMiddleware, adjustMenuPrices);

router.post('/voice-order', handleVoiceOrder);

router.post('/inventory-waste-alert', inventoryWasteAlert);

router.post('/allergy', customerallergy);

router.post('/smartwaste',smartLeftoverReuse);

router.post('/slowhour',slowHourAnalyzer);

router.post('/salesprofit', authMiddleware, salesProfitAdvisor);

router.post('/schedule', authMiddleware, createSchedule);

router.post('/waste-analysis', authMiddleware, async (req, res) => {
  try {
    const { analyzeWasteAndAdvice } = await import('../services/geminiService.js');
    const result = await analyzeWasteAndAdvice(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
