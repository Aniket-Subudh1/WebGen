import mongoose from 'mongoose';

const uiComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  preview: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'form', 'navigation', 'card', 'modal', 'button', 'layout', 'table', 'chart', 'other'],
    default: 'general'
  },
  framework: {
    type: String,
    enum: ['react', 'vue', 'angular', 'svelte', 'other'],
    default: 'react'
  },
  tags: {
    type: [String],
    default: []
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

uiComponentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

uiComponentSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return this.save();
};

uiComponentSchema.statics.findPopular = function(limit = 10) {
  return this.find()
    .sort({ usageCount: -1, rating: -1 })
    .limit(limit);
};

const UIComponent = mongoose.models.UIComponent || mongoose.model('UIComponent', uiComponentSchema);

export default UIComponent;