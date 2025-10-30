import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'El comentario no puede estar vacío'],
    maxlength: 1000
  },
  image: {
    type: String, // Base64 string
    default: null
  },
  imageType: {
    type: String, // image/jpeg, image/png, etc.
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Comment', commentSchema);