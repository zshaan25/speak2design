import Page    from '../models/Page.js';
import Project from '../models/Project.js';

// ── Helper — verify the project exists and belongs to the caller ──────────────
const ownedProject = async (projectId, userId) =>
  Project.findOne({ _id: projectId, user: userId });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:projectId/pages
// Returns all pages for a project sorted by order.
// Auto-creates a "Home" page (seeded from the project's legacy canvasState)
// the very first time a project is opened in multi-page mode.
// ─────────────────────────────────────────────────────────────────────────────
export const getPages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await ownedProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    let pages = await Page.find({ project: projectId }).sort({ order: 1 });

    // First-time migration: seed Home page from legacy single-canvas state
    if (pages.length === 0) {
      const homePage = await Page.create({
        project: projectId,
        name:   'Home',
        slug:   '/',
        order:  0,
        canvasState: project.canvasState || []
      });
      pages = [homePage];
    }

    res.json({ success: true, pages });
  } catch (err) {
    console.error('>>> getPages error:', err);
    res.status(500).json({ success: false, message: 'Failed to load pages.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/pages
// Creates a blank page. Body: { name?, slug? }
// ─────────────────────────────────────────────────────────────────────────────
export const createPage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await ownedProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const existingCount = await Page.countDocuments({ project: projectId });
    const pageName = req.body.name?.trim() || `Page ${existingCount + 1}`;
    const pageSlug = req.body.slug?.trim()
      || `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;

    const page = await Page.create({
      project: projectId,
      name:    pageName,
      slug:    pageSlug,
      order:   existingCount,
      canvasState: []
    });

    res.status(201).json({ success: true, page });
  } catch (err) {
    console.error('>>> createPage error:', err);
    res.status(500).json({ success: false, message: 'Failed to create page.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:projectId/pages/reorder
// Body: { pageIds: string[] } — desired order (first element = order 0)
// Must be declared BEFORE the /:pageId route to avoid "reorder" being captured
// as a pageId param.
// ─────────────────────────────────────────────────────────────────────────────
export const reorderPages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { pageIds } = req.body;

    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      return res.status(400).json({ success: false, message: 'pageIds must be a non-empty array.' });
    }

    const project = await ownedProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    await Promise.all(
      pageIds.map((id, index) =>
        Page.updateOne({ _id: id, project: projectId }, { order: index })
      )
    );

    res.json({ success: true, message: 'Pages reordered.' });
  } catch (err) {
    console.error('>>> reorderPages error:', err);
    res.status(500).json({ success: false, message: 'Failed to reorder pages.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:projectId/pages/:pageId
// Update name, slug, or canvasState. Body: { name?, slug?, canvasState? }
// ─────────────────────────────────────────────────────────────────────────────
export const updatePage = async (req, res) => {
  try {
    const { projectId, pageId } = req.params;
    const { name, slug, canvasState } = req.body;

    const project = await ownedProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const page = await Page.findOne({ _id: pageId, project: projectId });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found.' });

    if (name        !== undefined) page.name        = name.trim();
    if (slug        !== undefined) page.slug        = slug.trim();
    if (canvasState !== undefined) page.canvasState = canvasState;

    await page.save();
    res.json({ success: true, page });
  } catch (err) {
    console.error('>>> updatePage error:', err);
    res.status(500).json({ success: false, message: 'Failed to update page.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/pages/:pageId
// Refuses to delete the last page. Re-numbers remaining pages.
// ─────────────────────────────────────────────────────────────────────────────
export const deletePage = async (req, res) => {
  try {
    const { projectId, pageId } = req.params;

    const project = await ownedProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const total = await Page.countDocuments({ project: projectId });
    if (total <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last page. A project must have at least one page.'
      });
    }

    const deleted = await Page.findOneAndDelete({ _id: pageId, project: projectId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Page not found.' });

    // Re-number remaining pages so order values stay contiguous
    const remaining = await Page.find({ project: projectId }).sort({ order: 1 });
    await Promise.all(remaining.map((p, i) => Page.updateOne({ _id: p._id }, { order: i })));

    res.json({ success: true, message: 'Page deleted.' });
  } catch (err) {
    console.error('>>> deletePage error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete page.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/pages/:pageId/duplicate
// Clones name, slug (with "-copy" suffix), and canvasState.
// ─────────────────────────────────────────────────────────────────────────────
export const duplicatePage = async (req, res) => {
  try {
    const { projectId, pageId } = req.params;

    const project = await ownedProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const source = await Page.findOne({ _id: pageId, project: projectId });
    if (!source) return res.status(404).json({ success: false, message: 'Page not found.' });

    const existingCount = await Page.countDocuments({ project: projectId });

    const duplicate = await Page.create({
      project:     projectId,
      name:        `${source.name} (Copy)`,
      slug:        `${source.slug}-copy`,
      order:       existingCount,
      canvasState: source.canvasState
    });

    res.status(201).json({ success: true, page: duplicate });
  } catch (err) {
    console.error('>>> duplicatePage error:', err);
    res.status(500).json({ success: false, message: 'Failed to duplicate page.' });
  }
};
