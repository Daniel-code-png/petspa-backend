import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido']
  },
  petName: {
    type: String,
    required: [true, 'El nombre de la mascota es requerido']
  },
  petType: {
    type: String,
    required: [true, 'El tipo de mascota es requerido'],
    enum: ['Perro', 'Gato', 'Otro']
  },
  petBreed: {
    type: String,
    default: 'Mestizo'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  termsAcceptedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);