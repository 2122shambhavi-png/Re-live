const express = require('express');
const multer = require('multer');
const userController = require('../controllers/userController');
const conversationController = require('../controllers/conversationController');

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Saathi Voice API'
  });
});

// User routes
router.post('/users', userController.createUser);
router.get('/users/:userId', userController.getUser);
router.put('/users/:userId/preferences', userController.updatePreferences);
router.post('/users/select-role', userController.selectRole);
router.get('/roles', userController.getAvailableRoles);

// Conversation routes
router.post('/conversation/voice', upload.single('audio'), conversationController.handleVoiceInput);
router.post('/conversation/text', conversationController.handleTextInput);
router.get('/conversation/history/:userId', conversationController.getHistory);
router.get('/conversation/memory/:userId', conversationController.getMemorySummary);

module.exports = router;
