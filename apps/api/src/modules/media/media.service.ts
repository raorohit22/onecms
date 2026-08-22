import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Media, IMediaDocument } from '@onecms/db';
import { ITenantContext } from '@api/core/context/tenant-context';
import { logger } from '@api/core/logger/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'onecms-media';

// Configure multer-s3
export const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      // Group by organization ID if tenant context is available, else generic folder
      const orgId = req.tenant?.organizationId || 'public';
      cb(null, `uploads/${orgId}/${filename}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Basic image filter
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

class MediaService {
  async saveMediaRecord(file: any, context: ITenantContext, uploaderId: string): Promise<IMediaDocument> {
    const media = new Media({
      organizationId: context.organizationId,
      uploaderId,
      filename: file.key.split('/').pop(),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: file.location, // multer-s3 provides the public URL in `location`
      key: file.key
    });

    return media.save();
  }

  async listMedia(context: ITenantContext, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const items = await Media.find({ organizationId: context.organizationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
      
    const total = await Media.countDocuments({ organizationId: context.organizationId });
    return { items, total, page, limit };
  }

  async deleteMedia(id: string, context: ITenantContext) {
    const media = await Media.findOne({ _id: id, organizationId: context.organizationId });
    if (!media) {
      throw new Error('Media not found');
    }

    // Delete from S3
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: media.key
      }));
    } catch (e) {
      logger.error({ err: e, mediaKey: media.key, mediaId: id }, 'Failed to delete media asset from S3 bucket');
      // Proceed to delete DB record anyway to avoid orphans if S3 is out of sync
    }

    await Media.deleteOne({ _id: id, organizationId: context.organizationId });
    return true;
  }
}

export const mediaService = new MediaService();
