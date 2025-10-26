import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * MCQ for knowledge check at the end of a stage.
 * We store correct_answer so frontend can highlight correct/incorrect after user selects.
 */
const QuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "Each question must have at least two options.",
      },
    },
    correct_answer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const KnowledgeDomainSchema = new Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    resources: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const StageSchema = new Schema(
  {
    stage_name: {
      type: String,
      required: true,
      trim: true,
    },

    relevance_status: {
      type: String,
      enum: ["required", "reference", "completed"],
      default: "required",
      required: true,
    },

    description: {
      // e.g. "This stage is not required for you, but reviewing these concepts may strengthen your fundamentals."
      type: String,
      default: "",
      trim: true,
    },

    knowledge_domains: {
      type: [KnowledgeDomainSchema],
      default: [],
    },

    expected_learning_outcomes: {
      type: [String],
      default: [],
    },

    knowledge_check: {
      instructions: {
        type: String,
        default: "Select the correct answer for each question.",
        trim: true,
      },
      questions: {
        type: [QuestionSchema],
        default: [],
      },
    },

    // per-stage progress tracking for UI
    progress: {
      viewed: {
        // user opened/read this stage
        type: Boolean,
        default: false,
      },
      quiz_done: {
        // user attempted the MCQs at least once
        type: Boolean,
        default: false,
      },
    },
  },
  { _id: false },
);

const RoadmapSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    career: {
      type: String,
      required: true,
      trim: true,
    },

    skill: {
      type: String,
      enum: ["Analytical", "Problem-Solving", "Leadership", "Artistic"],
      required: true,
    },

    current_level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },

    required_level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },

    stages: {
      type: [StageSchema],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Roadmap must include at least one stage.",
      },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);


RoadmapSchema.index({ user_id: 1, skill: 1 }, { unique: true });

const Roadmap = mongoose.model("Roadmap", RoadmapSchema);

export default Roadmap;
