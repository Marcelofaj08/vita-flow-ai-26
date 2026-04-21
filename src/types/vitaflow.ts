export type Goal = "manter" | "perder" | "ganhar";

export type DaySchedule = {
  day: string;
  /** Ex: "08:00-16:00" ou "Livre" */
  hours: string;
};

export type FixedCommitment = {
  title: string;
  /** Ex: "Segunda, Quarta" ou "Diário" */
  days: string;
  /** Ex: "18:00-19:00" */
  time: string;
};

export type RoutineInputs = {
  name: string;
  age?: string;
  /** Texto livre legado (mantido p/ compatibilidade) */
  schedule?: string;
  /** Horário escola/trabalho por dia da semana */
  weeklySchedule: DaySchedule[];
  /** Compromissos fixos recorrentes (aulas extra, consultas, etc.) */
  fixedCommitments: FixedCommitment[];
  goal: Goal;
  workoutDays: string[];
  wakeTime: string;
  sleepTime: string;
  dietary: string;
};

export type ScheduleBlock = {
  time: string;
  activity: string;
  type: "sono" | "estudo" | "treino" | "refeicao" | "lazer" | "trabalho" | "rotina";
};

export type DayPlan = {
  day: string;
  schedule: ScheduleBlock[];
  meals: { breakfast: string; lunch: string; snack: string; dinner: string };
  workout: string;
};

export type RoutinePlan = {
  summary: string;
  weekly_tip: string;
  days: DayPlan[];
  shopping_list: string[];
};