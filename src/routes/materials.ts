import { Router } from 'express';
import { createMaterial, getMaterials, updateStock } from '../controllers/materialController';

const router = Router();

router.post('/', createMaterial);
router.get('/', getMaterials);
router.patch('/:id/stock', updateStock);

export default router;