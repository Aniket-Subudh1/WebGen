import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  messages: {
    type: Array,
    default: [],
  },
  fileData: {
    type: Object,
    default: {},
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

workspaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);

export default Workspace;