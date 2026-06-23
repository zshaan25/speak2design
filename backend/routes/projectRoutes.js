import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import { createProject, getUserProjects, getProjectById, updateProjectCanvas, deleteProject } from '../controllers/projectController.js';

const router = express.Router();

router.post('/', requireAuthentication, createProject);
router.get('/', requireAuthentication, getUserProjects);
router.get('/:id', requireAuthentication, getProjectById);
router.put('/:id', requireAuthentication, updateProjectCanvas);
router.delete('/:id', requireAuthentication, deleteProject);

export default router;
