import { Database } from "@/integrations/supabase/types";

type Profile = {
  objetivo: string | null;
  nivel: string | null;
  dias_treino: string[] | null;
};

type ModelWorkout = Database["public"]["Tables"]["model_workouts"]["Row"];

type ScoredWorkout = {
  workout: ModelWorkout;
  score: number;
};

/**
 * Maps user objectives (can be array or string) to model objectives
 */
const mapUserObjectivesToModelObjectives = (userObjective: string | null): string[] => {
  if (!userObjective) return ["saude_condicionamento"];
  
  // Parse if it's a JSON string array (from database)
  let objectives: string[] = [];
  try {
    if (userObjective.startsWith('[')) {
      objectives = JSON.parse(userObjective);
    } else {
      objectives = [userObjective];
    }
  } catch {
    objectives = [userObjective];
  }
  
  const modelObjectives: string[] = [];
  
  objectives.forEach(obj => {
    const objective = obj.toLowerCase();
    
    if (objective.includes("ganhar_massa_muscular") || objective.includes("hipertrofia")) {
      modelObjectives.push("hipertrofia");
    }
    if (objective.includes("emagrecer") || objective.includes("perder_gordura")) {
      modelObjectives.push("emagrecimento");
    }
    if (objective.includes("ganhar_forca") || objective.includes("força")) {
      modelObjectives.push("forca");
    }
    if (objective.includes("melhorar_resistencia") || objective.includes("condicionamento") || objective.includes("manter_saude")) {
      modelObjectives.push("saude_condicionamento");
    }
  });
  
  return modelObjectives.length > 0 ? modelObjectives : ["saude_condicionamento"];
};

/**
 * Filters models by level with strict rules
 */
const filterByLevel = (
  models: ModelWorkout[],
  userLevel: string | null
): ModelWorkout[] => {
  if (!userLevel) return models;
  
  const nivel = userLevel.toLowerCase();
  
  // Try exact match first
  const exactMatches = models.filter(m => m.nivel.toLowerCase() === nivel);
  if (exactMatches.length > 0) {
    return exactMatches;
  }
  
  // Level-specific fallback rules
  if (nivel === "iniciante") {
    // Beginners: prefer iniciante, fallback to intermediario only if no iniciante
    const intermediario = models.filter(m => m.nivel.toLowerCase() === "intermediario");
    return intermediario.length > 0 ? intermediario : models;
  }
  
  if (nivel === "intermediario") {
    // Intermediate: accept iniciante or avancado as fallback
    return models;
  }
  
  if (nivel === "avancado") {
    // Advanced: prefer avancado > intermediario > iniciante
    const intermediario = models.filter(m => m.nivel.toLowerCase() === "intermediario");
    if (intermediario.length > 0) {
      return intermediario;
    }
    // Only return iniciante if absolutely no other options
    return models;
  }
  
  return models;
};

/**
 * Scores a model workout based on objectives match
 */
const scoreObjectives = (
  model: ModelWorkout,
  userObjectives: string[]
): number => {
  let score = 0;
  const modelObjective = model.objetivo.toLowerCase();
  
  userObjectives.forEach(userObj => {
    if (userObj === modelObjective) {
      score += 3; // Exact match
    } else if (
      (userObj === "hipertrofia" && modelObjective === "forca") ||
      (userObj === "forca" && modelObjective === "hipertrofia")
    ) {
      score += 2; // Complementary objectives
    }
  });
  
  // Bonus if model matches multiple user objectives
  if (userObjectives.length > 1 && score >= 3) {
    score += 1;
  }
  
  return score;
};

/**
 * Scores a model based on level match
 */
const scoreLevel = (
  model: ModelWorkout,
  userLevel: string | null
): number => {
  if (!userLevel) return 0;
  
  const modelNivel = model.nivel.toLowerCase();
  const nivel = userLevel.toLowerCase();
  
  if (modelNivel === nivel) {
    return 2; // Exact match
  }
  
  return 0;
};

/**
 * Scores a model based on days per week
 */
const scoreDays = (
  model: ModelWorkout,
  userDays: number
): number => {
  const modelDays = model.dias_semana_sugeridos;
  if (!modelDays) return 0;
  
  const diff = Math.abs(userDays - modelDays);
  
  if (diff === 0) return 3; // Perfect match
  if (diff === 1) return 2; // Close
  if (diff === 2) return 1; // Acceptable
  
  return 0;
};

/**
 * Scores a model based on workout split type matching user frequency
 */
const scoreSplitType = (
  model: ModelWorkout,
  userDays: number
): number => {
  const splitType = model.tipo_divisao?.toLowerCase();
  if (!splitType) return 0;
  
  if (userDays <= 3) {
    if (splitType === "full_body" || splitType === "circuito") {
      return 2;
    }
  } else if (userDays === 4) {
    if (splitType === "upper_lower") {
      return 2;
    }
  } else if (userDays >= 5) {
    if (splitType === "push_pull_legs" || splitType === "grupo_muscular") {
      return 2;
    }
  }
  
  return 0;
};

/**
 * Recommends the best model workout based on user profile using intelligent scoring
 */
export const recommendModelWorkout = (
  profile: Profile,
  modelWorkouts: ModelWorkout[]
): ModelWorkout | null => {
  if (!modelWorkouts || modelWorkouts.length === 0) {
    return null;
  }

  // Parse user objectives
  const userObjectives = mapUserObjectivesToModelObjectives(profile.objetivo);
  const userDays = profile.dias_treino?.length || 3; // Default to 3 if not set
  
  // STEP 1: Filter by level (strict rules)
  let filteredModels = filterByLevel(modelWorkouts, profile.nivel);
  
  // STEP 2: Score each model
  const scoredWorkouts: ScoredWorkout[] = filteredModels.map(model => {
    let totalScore = 0;
    
    // Score objectives
    totalScore += scoreObjectives(model, userObjectives);
    
    // Score level match
    totalScore += scoreLevel(model, profile.nivel);
    
    // Score days per week
    totalScore += scoreDays(model, userDays);
    
    // Score split type
    totalScore += scoreSplitType(model, userDays);
    
    return {
      workout: model,
      score: totalScore
    };
  });
  
  // STEP 3: Sort by score (descending)
  scoredWorkouts.sort((a, b) => b.score - a.score);
  
  // STEP 4: Apply tiebreaker rules if top scores are equal
  if (scoredWorkouts.length > 1 && scoredWorkouts[0].score === scoredWorkouts[1].score) {
    // Tiebreaker 1: Exact level match
    const exactLevelMatch = scoredWorkouts.filter(
      sw => profile.nivel && sw.workout.nivel.toLowerCase() === profile.nivel.toLowerCase()
    );
    if (exactLevelMatch.length > 0) {
      return exactLevelMatch[0].workout;
    }
    
    // Tiebreaker 2: Closest days
    const bestDaysMatch = scoredWorkouts.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.workout.dias_semana_sugeridos || userDays) - userDays);
      const currDiff = Math.abs((curr.workout.dias_semana_sugeridos || userDays) - userDays);
      return currDiff < prevDiff ? curr : prev;
    });
    return bestDaysMatch.workout;
  }
  
  // Return best scored workout
  return scoredWorkouts[0]?.workout || null;
};

