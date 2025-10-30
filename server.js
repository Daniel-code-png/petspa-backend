import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Rutas
import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import appointmentRoutes from './routes/appointments.js';
import commentRoutes from './routes/comments.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🐾 Pet Spa API funcionando correctamente' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://petspa-frontend.vercel.app/'] // Reemplaza con tu URL de frontend
    : ['http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

// Para Vercel (serverless)
export default app