/**
 * services/s3.js  (Segment 8)
 * AWS S3 utilities for Speak2Design.
 * Exports:
 *   - uploadAudioToS3()         — stores voice audio for debugging/logging
 *   - deleteFromS3()            — removes any S3 object by key
 *   - uploadThumbnailToS3()     — stores canvas thumbnail PNG
 *   - getPresignedUploadUrl()   — returns a pre-signed PUT URL for direct client upload
 *
 * GRACEFUL DEGRADATION: All functions return { success: false, reason } instead
 * of throwing when AWS credentials are missing. Controllers check this and continue
 * without S3 rather than crashing.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── Lazy S3 client ───────────────────────────────────────────────────────────
let _s3Client = null;

const getS3Client = () => {
  if (_s3Client) return _s3Client;
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    return null; // Graceful degradation — credentials not configured
  }
  _s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId:     AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  return _s3Client;
};

const getBucket = () => process.env.AWS_S3_BUCKET || null;

/** Returns true if S3 is fully configured */
export const isS3Configured = () => !!getS3Client() && !!getBucket();

// ─── uploadAudioToS3 ──────────────────────────────────────────────────────────
/**
 * Uploads a voice audio buffer to S3 for debug/audit storage.
 *
 * @param {Buffer} audioBuffer  Raw audio bytes
 * @param {string} mimeType     e.g. 'audio/webm'
 * @param {string} userId       MongoDB User _id string
 * @returns {Promise<{success: boolean, key?: string, url?: string, reason?: string}>}
 */
export const uploadAudioToS3 = async (audioBuffer, mimeType, userId) => {
  const s3     = getS3Client();
  const bucket = getBucket();
  if (!s3 || !bucket) return { success: false, reason: 'S3 not configured.' };

  try {
    const ext  = (mimeType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm';
    const key  = `audio/${userId}/${Date.now()}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        audioBuffer,
      ContentType: mimeType || 'audio/webm',
    }));
    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { success: true, key, url };
  } catch (err) {
    console.warn('>>> S3 audio upload failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// ─── deleteFromS3 ─────────────────────────────────────────────────────────────
/**
 * Deletes any S3 object by key.
 *
 * @param {string} key  S3 object key (not the full URL)
 * @returns {Promise<{success: boolean, reason?: string}>}
 */
export const deleteFromS3 = async (key) => {
  const s3     = getS3Client();
  const bucket = getBucket();
  if (!s3 || !bucket) return { success: false, reason: 'S3 not configured.' };
  if (!key) return { success: false, reason: 'No key provided.' };

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return { success: true };
  } catch (err) {
    console.warn('>>> S3 delete failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// ─── uploadThumbnailToS3 ─────────────────────────────────────────────────────
/**
 * Uploads a canvas thumbnail PNG to S3.
 *
 * @param {Buffer} imageBuffer  PNG image bytes
 * @param {string} projectId    MongoDB Project _id string
 * @returns {Promise<{success: boolean, key?: string, url?: string, reason?: string}>}
 */
export const uploadThumbnailToS3 = async (imageBuffer, projectId) => {
  const s3     = getS3Client();
  const bucket = getBucket();
  if (!s3 || !bucket) return { success: false, reason: 'S3 not configured.' };

  try {
    const key = `thumbnails/${projectId}/${Date.now()}.png`;
    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        imageBuffer,
      ContentType: 'image/png',
    }));
    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { success: true, key, url };
  } catch (err) {
    console.warn('>>> S3 thumbnail upload failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// ─── getPresignedUploadUrl ────────────────────────────────────────────────────
/**
 * Generates a pre-signed S3 PUT URL so the client can upload directly.
 * Useful for large audio files — avoids routing through the Node server.
 *
 * @param {string} folder      S3 key prefix, e.g. 'audio' or 'thumbnails'
 * @param {string} filename    Filename to use in S3 key
 * @param {string} contentType MIME type of the upload
 * @param {number} expiresIn   Seconds before URL expires (default 300 = 5 min)
 * @returns {Promise<{success: boolean, url?: string, key?: string, reason?: string}>}
 */
export const getPresignedUploadUrl = async (folder, filename, contentType, expiresIn = 300) => {
  const s3     = getS3Client();
  const bucket = getBucket();
  if (!s3 || !bucket) return { success: false, reason: 'S3 not configured.' };

  try {
    const key     = `${folder}/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3, command, { expiresIn });
    return { success: true, url, key };
  } catch (err) {
    console.warn('>>> S3 presigned URL failed:', err.message);
    return { success: false, reason: err.message };
  }
};
