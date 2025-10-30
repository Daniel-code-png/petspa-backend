import express from 'express';
import Appointment from '../models/Appointment.js';
import Comment from '../models/Comment.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Obtener estadísticas del dashboard
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalAppointments = await Appointment.countDocuments();
    const totalServices = await Service.countDocuments({ isActive: true });
    const totalComments = await Comment.countDocuments();

    // Estadísticas de citas por estado
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Citas del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const appointmentsThisMonth = await Appointment.countDocuments({
      date: { $gte: startOfMonth }
    });

    // Ingresos estimados del mes (suma de precios de servicios)
    const appointmentsWithServices = await Appointment.find({
      date: { $gte: startOfMonth },
      status: { $in: ['Pendiente', 'Confirmada', 'Completada'] }
    }).populate('service');

    const monthlyRevenue = appointmentsWithServices.reduce((sum, apt) => {
      return sum + (apt.service ? apt.service.price : 0);
    }, 0);

    // Servicio más popular
    const popularServices = await Appointment.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const populatedPopularServices = await Service.populate(popularServices, {
      path: '_id',
      select: 'name price'
    });

    res.json({
      totalUsers,
      totalAppointments,
      totalServices,
      totalComments,
      appointmentsByStatus,
      appointmentsThisMonth,
      monthlyRevenue,
      popularServices: populatedPopularServices
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/appointments
// @desc    Obtener todas las citas (admin)
// @access  Private/Admin
router.get('/appointments', protect, admin, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user', 'name email phone petName petType petBreed')
      .populate('service', 'name price duration')
      .sort({ date: -1, time: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/comments
// @desc    Obtener todos los comentarios (admin)
// @access  Private/Admin
router.get('/comments', protect, admin, async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('user', 'name email petName')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Obtener todos los usuarios (admin)
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;