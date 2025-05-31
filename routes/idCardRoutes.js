const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');


// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
router.post('/', protect, upload.single('photo'), idCardController.createIdCard);
router.get('/', protect, idCardController.getAllIdCards);
router.get('/:id', protect, idCardController.getIdCardById);
router.put('/:id', protect, upload.single('photo'), idCardController.updateIdCard);
router.delete('/:id', protect, idCardController.deleteIdCard);

// PDF Routes
router.get('/pdf/all', protect, idCardController.generateAllPDFs);
router.get('/pdf/:id', protect, idCardController.generatePDF);

// Excel Bulk Upload Route
router.post('/bulk-upload', protect, upload.single('file'), idCardController.bulkUploadFromExcel);

module.exports = router;
