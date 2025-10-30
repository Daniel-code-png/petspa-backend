import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const adminExists = await User.findOne({ email: 'admin@petspa.com' });
    
    if (adminExists) {
      console.log('⚠️  El usuario admin ya existe');
      process.exit(0);
    }

    // Crear usuario admin
    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@petspa.com',
      password: 'admin123', // Se hasheará automáticamente por el pre-save hook
      phone: '3001234567',
      petName: 'Admin Pet',
      petType: 'Perro',
      petBreed: 'N/A',
      isAdmin: true,
      termsAccepted: true,
      termsAcceptedDate: new Date()
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: admin@petspa.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();