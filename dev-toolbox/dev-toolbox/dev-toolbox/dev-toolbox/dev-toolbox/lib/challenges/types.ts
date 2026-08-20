export type ChallengeRole       = "qa" | "frontend" | "backend";
export type ChallengeDifficulty = "easy" | "medium" | "hard";
export type ChallengeType       = "find_bug" | "fix_code" | "write_regex" | "decode" | "test_cases" | "api_analysis" | "sql_fix";

export interface Challenge {
  id:              string;
  role:            ChallengeRole;
  difficulty:      ChallengeDifficulty;
  type:            ChallengeType;
  title:           string;
  title_ru?:       string;
  description:     string;
  description_ru?: string;
  input_data:      string;
  hint?:           string;
  hint_ru?:        string;
  correct_answer:  string;
  answer_type:     "exact" | "contains" | "regex";
  explanation:     string;
  explanation_ru?: string;
  points:          number;
  is_daily:        boolean;
  daily_date?:     string;
  created_at:      string;
}

export interface ChallengeAttempt {
  id:             string;
  user_id:        string;
  challenge_id:   string;
  is_correct:     boolean;
  answer_given?:  string;
  time_seconds?:  number;
  attempts_count: number;
  hints_used:     number;
  points_earned:  number;
  completed_at:   string;
}

export interface UserStreak {
  user_id:        string;
  current_streak: number;
  longest_streak: number;
  last_active?:   string;
  total_solved:   number;
  total_points:   number;
}

export const ROLE_META: Record<ChallengeRole, { label: string; labelRu: string; color: string; description: string; descriptionRu: string }> = {
  qa:       { label:"QA Engineer",      labelRu:"QA-инженер",            color:"amber", description:"Test cases, bug hunting, API testing, regex", descriptionRu:"Тест-кейсы, поиск багов, API, регулярные выражения" },
  frontend: { label:"Frontend Dev",     labelRu:"Frontend-разработчик",  color:"blue",  description:"CSS, JavaScript, React, browser security",    descriptionRu:"CSS, JavaScript, React, безопасность браузера" },
  backend:  { label:"Backend Dev",      labelRu:"Backend-разработчик",   color:"green", description:"APIs, SQL, security, HTTP, authentication",    descriptionRu:"API, SQL, безопасность, HTTP, аутентификация" },
};

export const DIFFICULTY_META: Record<ChallengeDifficulty, { label: string; labelRu: string; points: number; colorClass: string }> = {
  easy:   { label:"Easy",   labelRu:"Лёгкий",  points:10, colorClass:"text-success" },
  medium: { label:"Medium", labelRu:"Средний", points:25, colorClass:"text-amber-400" },
  hard:   { label:"Hard",   labelRu:"Сложный", points:50, colorClass:"text-error" },
};

export const TYPE_META: Record<ChallengeType, { label: string; labelRu: string }> = {
  find_bug:    { label:"Find the Bug",   labelRu:"Найди баг" },
  fix_code:    { label:"Fix the Code",   labelRu:"Исправь код" },
  write_regex: { label:"Write Regex",    labelRu:"Напиши Regex" },
  decode:      { label:"Decode",         labelRu:"Декодируй" },
  test_cases:  { label:"Test Cases",     labelRu:"Тест-кейсы" },
  api_analysis:{ label:"API Analysis",   labelRu:"Анализ API" },
  sql_fix:     { label:"SQL Fix",        labelRu:"Исправь SQL" },
};
