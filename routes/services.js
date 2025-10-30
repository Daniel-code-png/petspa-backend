import express from 'express';
import Service from '../models/Service.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// @route   GET /api/services
// @desc    Obtener todos los servicios activos
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/services/:id
// @desc    Obtener un servicio por ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/services
// @desc    Crear servicio (solo admin)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    const service = await Service.create({
      name,
      description,
      price,
      duration: duration || 30
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/services/:id
// @desc    Actualizar servicio (solo admin)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const { name, description, price, duration, isActive } = req.body;

    service.name = name || service.name;
    service.description = description || service.description;
    service.price = price !== undefined ? price : service.price;
    service.duration = duration || service.duration;
    service.isActive = isActive !== undefined ? isActive : service.isActive;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/services/:id
// @desc    Eliminar servicio (solo admin)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    await service.deleteOne();
    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;