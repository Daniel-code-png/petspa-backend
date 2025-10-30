import express from 'express';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/comments
// @desc    Obtener todos los comentarios
// @access  Public
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('user', 'name petName')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/comments
// @desc    Crear comentario
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { text, image, imageType } = req.body;

    // Validar tamaño de imagen (máximo 5MB en base64)
    if (image && image.length > 7000000) {
      return res.status(400).json({ message: 'La imagen es demasiado grande (máximo 5MB)' });
    }

    const comment = await Comment.create({
      user: req.user._id,
      text,
      image: image || null,
      imageType: imageType || null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name petName');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/comments/:id
// @desc    Actualizar comentario (solo el dueño)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificar que el usuario sea dueño del comentario
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado para editar este comentario' });
    }

    const { text, image, imageType } = req.body;

    // Validar tamaño de imagen
    if (image && image.length > 7000000) {
      return res.status(400).json({ message: 'La imagen es demasiado grande (máximo 5MB)' });
    }

    comment.text = text || comment.text;
    comment.image = image !== undefined ? image : comment.image;
    comment.imageType = imageType !== undefined ? imageType : comment.imageType;

    const updatedComment = await comment.save();
    const populatedComment = await Comment.findById(updatedComment._id)
      .populate('user', 'name petName');

    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Eliminar comentario (dueño o admin)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificar que el usuario sea dueño del comentario o admin
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'No autorizado para eliminar este comentario' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comentario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;