export function validateRoadmapOutput(roadmap) {
  const errors = [];

  // --- Top-level validation
  if (!roadmap) {
    errors.push("Missing roadmap object.");
    return { valid: false, errors };
  }

  if (!roadmap.skill || typeof roadmap.skill !== "string") {
    errors.push("Invalid or missing 'skill' field.");
  }

  if (!roadmap.career || typeof roadmap.career !== "string") {
    errors.push("Invalid or missing 'career' field.");
  }

  if (!roadmap.stages || !Array.isArray(roadmap.stages) || roadmap.stages.length === 0) {
    errors.push("Missing or empty 'stages' array.");
  }

  // --- Stage-level validation
  roadmap.stages?.forEach((stage, index) => {
    const stagePath = `stages[${index}]`;

    if (!stage.stage_name) {
      errors.push(`${stagePath}: Missing 'stage_name'.`);
    }

    if (!stage.relevance_status) {
      errors.push(`${stagePath}: Missing 'relevance_status'.`);
    }

    // Knowledge domains
    if (!stage.knowledge_domains || !Array.isArray(stage.knowledge_domains) || stage.knowledge_domains.length === 0) {
      errors.push(`${stagePath}: Missing or empty 'knowledge_domains'.`);
    } else {
      stage.knowledge_domains.forEach((domain, dIndex) => {
        if (!domain.topic) {
          errors.push(`${stagePath}.knowledge_domains[${dIndex}]: Missing 'topic'.`);
        }
        if (!domain.resources || !Array.isArray(domain.resources) || domain.resources.length === 0) {
          errors.push(`${stagePath}.knowledge_domains[${dIndex}]: Missing or empty 'resources'.`);
        }
      });
    }

    // Expected learning outcomes
    if (
      !stage.expected_learning_outcomes ||
      !Array.isArray(stage.expected_learning_outcomes) ||
      stage.expected_learning_outcomes.length === 0
    ) {
      errors.push(`${stagePath}: Missing 'expected_learning_outcomes'.`);
    }

    // Knowledge check
    const kc = stage.knowledge_check;
    if (!kc || typeof kc !== "object") {
      errors.push(`${stagePath}: Missing 'knowledge_check' object.`);
    } else if (!Array.isArray(kc.questions) || kc.questions.length === 0) {
      errors.push(`${stagePath}: Missing or empty 'knowledge_check.questions' array.`);
    } else {
      // Ensure at least 5 questions exist (OpenAI may sometimes return fewer)
      if (kc.questions.length < 5) {
        errors.push(`${stagePath}: Less than 5 MCQs generated.`);
      }

      kc.questions.forEach((q, qIndex) => {
        if (!q.question || typeof q.question !== "string") {
          errors.push(`${stagePath}.knowledge_check.questions[${qIndex}]: Missing 'question' text.`);
        }

        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`${stagePath}.knowledge_check.questions[${qIndex}]: Must have at least 2 options.`);
        }

        if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
          errors.push(
            `${stagePath}.knowledge_check.questions[${qIndex}]: 'correct_answer' missing or not in options.`
          );
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
