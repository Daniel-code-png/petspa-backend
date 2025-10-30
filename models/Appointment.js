import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida']
  },
  time: {
    type: String,
    required: [true, 'La hora es requerida'],
    validate: {
      validator: function(v) {
        // Validar formato HH:MM
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Formato de hora inválido (usar HH:MM)'
    }
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Confirmada', 'Completada', 'Cancelada'],
    default: 'Pendiente'
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar citas duplicadas en el mismo horario
appointmentSchema.index({ date: 1, time: 1 }, { unique: true });

export default mongoose.model('Appointment', appointmentSchema);