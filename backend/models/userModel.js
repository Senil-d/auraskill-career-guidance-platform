const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    traits: {
      type: Map,
      of: Number, // e.g., { DM: 85, EC: 70, ... }
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
