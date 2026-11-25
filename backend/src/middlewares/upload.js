'use strict';

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

fs.mkdirSync(env.uploadDir, { recursive: true });

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    const extension = EXTENSIONS[file.mimetype];
    const safeId = String(req.params.id || 'game').replace(/[^a-zA-Z0-9-]/g, '');
    cb(null, `${safeId}-${randomUUID()}.${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) {
      return cb(ApiError.badRequest('Formato no permitido. Usa JPG, PNG, WEBP o GIF.'));
    }
    return cb(null, true);
  },
});

module.exports = upload.single('image');
