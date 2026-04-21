export type Goal = "manter" | "perder" | "ganhar";

export type RoutineInputs = {
  name: string;
  age?: string;
  schedule: string;
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