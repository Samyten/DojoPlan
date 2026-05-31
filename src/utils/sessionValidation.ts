import type { CreateSessionInput } from '../types';

export function validateSessionInput(input: CreateSessionInput) {
  if (!input.title.trim()) {
    return 'Le titre du cours est obligatoire.';
  }

  if (!input.date) {
    return 'La date est obligatoire.';
  }

  if (!input.startTime) {
    return "L'heure de début est obligatoire.";
  }

  if (!input.endTime) {
    return "L'heure de fin est obligatoire.";
  }

  if (input.endTime <= input.startTime) {
    return "L'heure de fin doit être après l'heure de début.";
  }

  return undefined;
}

export function assertValidSessionInput(input: CreateSessionInput) {
  const validationError = validateSessionInput(input);

  if (validationError) {
    throw new Error(validationError);
  }
}
