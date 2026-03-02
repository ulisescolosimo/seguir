export type StartMode = "zero" | "prompts";

export type OnboardingPrefs = {
  onboardingCompleted: boolean;
  remindersPerWeek: 0 | 1 | 2 | 3;
};
