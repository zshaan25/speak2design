import crypto from 'crypto';
import Project from '../models/Project.js';
import { uploadThumbnailToS3, isS3Configured } from '../services/s3.js';

// Create a new project for logged-in user
export const createProject = async (req, res) => {
  try {
    const { title, language } = req.body;
    const newProject = await Project.create({
      user: req.user._id,
      title: title || 'Untitled Project',
      language: language || 'English',
      canvasState: [],
      historyStack: [],
      historyPointer: -1
    });
    return res.status(201).json({ success: true, project: newProject });
  } catch (err) {
    console.error('>>> Project creation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
};

// Get all projects for logged-in user — supports sidebar views via ?filter=
export const getUserProjects = async (req, res) => {
  try {
    const { filter } = req.query;
    const base = { user: req.user._id };
    let q;
    switch (filter) {
      case 'trash':     q = { ...base, deletedAt: { $ne: null } }; break;
      case 'favorites': q = { ...base, deletedAt: null, isFavorite: true }; break;
      case 'archived':  q = { ...base, deletedAt: null, isArchived: true }; break;
      case 'drafts':    q = { ...base, deletedAt: null, isArchived: false, canvasState: { $size: 0 } }; break;
      case 'shared':    q = { ...base, deletedAt: null, isPublic: true }; break;
      default:          q = { ...base, deletedAt: null, isArchived: false }; // all / recent
    }
    const projects = await Project.find(q).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, projects });
  } catch (err) {
    console.error('>>> Projects fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
};

// Toggle a flag (favorite / archive) on a project.
const toggleFlag = (field) => async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    const next = req.body[field] !== undefined ? Boolean(req.body[field]) : !project[field];
    project[field] = next;
    await project.save();
    return res.status(200).json({ success: true, [field]: next });
  } catch (err) {
    console.error(`>>> Toggle ${field} error:`, err);
    return res.status(500).json({ success: false, message: `Failed to update ${field}.` });
  }
};
export const toggleFavorite = toggleFlag('isFavorite');
export const toggleArchive  = toggleFlag('isArchived');

// Restore a trashed project.
export const restoreProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { deletedAt: null } },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.status(200).json({ success: true, message: 'Project restored.' });
  } catch (err) {
    console.error('>>> Restore project error:', err);
    return res.status(500).json({ success: false, message: 'Failed to restore project.' });
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.status(200).json({ success: true, project });
  } catch (err) {
    console.error('>>> Project fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
};

// Update canvas state of a project
export const updateProjectCanvas = async (req, res) => {
  try {
    const { canvasState, title, language } = req.body;
    const updateData = {};
    if (canvasState !== undefined) updateData.canvasState = canvasState;
    if (title) updateData.title = title;
    if (language) updateData.language = language;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updateData },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.status(200).json({ success: true, project });
  } catch (err) {
    console.error('>>> Project update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
};

// Toggle project public sharing
export const shareProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const makePublic = req.body.isPublic !== undefined ? Boolean(req.body.isPublic) : !project.isPublic;
    if (makePublic && !project.shareToken) {
      project.shareToken = crypto.randomBytes(16).toString('hex');
    }
    project.isPublic = makePublic;
    await project.save();

    return res.status(200).json({ success: true, isPublic: project.isPublic, shareToken: project.shareToken });
  } catch (err) {
    console.error('>>> Share project error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle share.' });
  }
};

// Regenerate share token
export const regenerateShareToken = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    project.shareToken = crypto.randomBytes(16).toString('hex');
    project.isPublic   = true;
    await project.save();

    return res.status(200).json({ success: true, isPublic: project.isPublic, shareToken: project.shareToken });
  } catch (err) {
    console.error('>>> Regenerate share token error:', err);
    return res.status(500).json({ success: false, message: 'Failed to regenerate share link.' });
  }
};

// Public view — no auth required
export const getPublicProject = async (req, res) => {
  try {
    const project = await Project.findOne({ shareToken: req.params.token, isPublic: true })
      .select('title canvasState');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found or not public.' });
    return res.status(200).json({ success: true, project });
  } catch (err) {
    console.error('>>> Public project fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch public project.' });
  }
};

// Delete a project — soft-delete (move to Trash) by default; ?permanent=true purges.
export const deleteProject = async (req, res) => {
  try {
    const permanent = req.query.permanent === 'true';
    if (permanent) {
      const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
      return res.status(200).json({ success: true, message: 'Project permanently deleted.' });
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.status(200).json({ success: true, message: 'Project moved to Trash.' });
  } catch (err) {
    console.error('>>> Project delete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
};

// POST /api/projects/:id/thumbnail
export const uploadThumbnail = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Thumbnail image is required.' });

    if (!isS3Configured()) {
      return res.status(200).json({ success: true, s3Available: false, message: 'S3 not configured — thumbnail not stored.' });
    }

    const result = await uploadThumbnailToS3(req.file.buffer, req.params.id);
    if (!result.success) {
      return res.status(200).json({ success: true, s3Available: true, stored: false, message: `Thumbnail upload failed: ${result.reason}` });
    }

    project.thumbnailUrl = result.url;
    await project.save();

    return res.status(200).json({ success: true, s3Available: true, stored: true, thumbnailUrl: result.url, key: result.key });
  } catch (err) {
    console.error('>>> Thumbnail upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload thumbnail.' });
  }
};
