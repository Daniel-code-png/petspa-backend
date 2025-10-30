import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del servicio es requerido'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: 0
  },
  duration: {
    type: Number,
    default: 30, // minutos
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Service', serviceSchema);