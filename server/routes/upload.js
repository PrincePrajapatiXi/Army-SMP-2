const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Upload image endpoint
router.post('/', requireAdminAuth, upload.single('image'), async (req, res) => {
    console.log('[Upload API] Request received');
    try {
        if (!req.file) {
            console.error('[Upload API] No file received');
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log(`[Upload API] Processing file: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary using secure signed upload
        console.log('[Upload API] Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'army-smp',
            resource_type: 'image'
        });

        console.log('[Upload API] Upload success:', result.secure_url);

        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error) {
        console.error('[Upload API] Upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: error.message,
            details: error
        });
    }
});

// Delete image endpoint (optional - for cleanup)
router.delete('/:publicId', async (req, res) => {
    try {
        const publicId = req.params.publicId;
        await cloudinary.uploader.destroy(`army-smp/${publicId}`);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;
