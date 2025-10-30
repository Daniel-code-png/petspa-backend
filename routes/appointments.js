import express from 'express';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Función para generar slots de tiempo disponibles
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

// Función helper para formatear fecha sin zona horaria
const formatDateWithoutTimezone = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @route   GET /api/appointments/available/:date
// @desc    Obtener horarios disponibles para una fecha
// @access  Private
router.get('/available/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const allSlots = generateTimeSlots();

    // Crear fecha al inicio del día en hora local
    const searchDate = new Date(date + 'T00:00:00');

    // Obtener citas existentes para esa fecha
    const appointments = await Appointment.find({
      date: {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      },
      status: { $ne: 'Cancelada' }
    }).select('time');

    const bookedSlots = appointments.map(apt => apt.time);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      date,
      allSlots,
      bookedSlots,
      availableSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/appointments
// @desc    Crear cita
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { service, date, time } = req.body;

    // Validar que el servicio existe
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Validar horario de trabajo (10am - 6pm)
    const [hour] = time.split(':').map(Number);
    if (hour < 10 || hour >= 18) {
      return res.status(400).json({ message: 'Horario fuera del rango permitido (10:00 - 18:00)' });
    }

    // Crear fecha sin problemas de zona horaria
    const appointmentDate = new Date(date + 'T12:00:00');

    // Verificar si ya existe una cita en ese horario
    const existingAppointment = await Appointment.findOne({
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      time,
      status: { $ne: 'Cancelada' }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Este horario ya está ocupado' });
    }

    const appointment = await Appointment.create({
      user: req.user._id,
      service,
      date: new Date(date + 'T12:00:00'),
      time
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('user', 'name email phone petName petType petBreed')
      .populate('service', 'name description price duration');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Este horario ya está ocupado' });
    }
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/appointments/my
// @desc    Obtener citas del usuario
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('service', 'name description price duration')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/appointments/:id
// @desc    Obtener una cita por ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'name email phone petName petType petBreed')
      .populate('service', 'name description price duration');

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar que el usuario sea dueño de la cita
    if (appointment.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Actualizar cita
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar que el usuario sea dueño de la cita
    if (appointment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { service, date, time, status } = req.body;

    // Si se cambia la fecha u hora, verificar disponibilidad
    if (date || time) {
      const newDate = date ? new Date(date + 'T12:00:00') : appointment.date;
      const newTime = time || appointment.time;

      const searchDate = new Date(newDate);
      
      const existingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        date: {
          $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59, 999))
        },
        time: newTime,
        status: { $ne: 'Cancelada' }
      });

      if (existingAppointment) {
        return res.status(400).json({ message: 'Este horario ya está ocupado' });
      }

      if (date) {
        appointment.date = new Date(date + 'T12:00:00');
      }
    }

    appointment.service = service || appointment.service;
    appointment.time = time || appointment.time;
    appointment.status = status || appointment.status;

    const updatedAppointment = await appointment.save();
    const populatedAppointment = await Appointment.findById(updatedAppointment._id)
      .populate('user', 'name email phone petName petType petBreed')
      .populate('service', 'name description price duration');

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancelar/Eliminar cita
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar que el usuario sea dueño de la cita
    if (appointment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Cambiar estado a cancelada en lugar de eliminar
    appointment.status = 'Cancelada';
    await appointment.save();

    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;