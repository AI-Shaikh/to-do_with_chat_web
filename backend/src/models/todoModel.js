import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: String,
    alarmTime: Date,
    googleEventId: String,
    completed: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

export default mongoose.model('Todo', TodoSchema);
