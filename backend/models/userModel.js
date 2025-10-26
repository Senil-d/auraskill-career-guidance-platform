const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    traits: {
      type: Map,
      of: Number, // e.g., { DM: 85, EC: 70, ... } or { Realistic: 5, Artistic: 8, ... }
      default: {},
    },
    overall_score: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    AL_stream: {
      type: String,
      default: null,
      trim: true,
    },
    specialization: {
      type: String,
      default: null,
      trim: true,
    },
    career: {
      type: String,
      default: null,
      trim: true,
    },
    decisionStyle: {
      type: String,
      default: null,
      trim: true,
    },
    requiredSkills: {
      type: Map,
      of: Number,
      default: {},
    },
    skillJustification: {
      type: String,
      default: null,
    },
    results: {
      type: Map,
      of: resultSchema,
      default: {},
    },
    artisticHistory: {
      type: [
        {
          traits: {
            type: Map,
            of: Number,
            default: {},
          },
          overall_score: Number,
          level: String,
          feedback: String,
          details: mongoose.Schema.Types.Mixed,
          attemptNumber: Number,
          completedAt: Date,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
