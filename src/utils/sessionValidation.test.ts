import { describe, expect, it } from 'vitest';
import { validateSessionInput } from './sessionValidation';
import type { CreateSessionInput } from '../types';

const validSessionInput: CreateSessionInput = {
  title: 'Stage kata',
  date: '2026-06-13',
  startTime: '14:00',
  endTime: '16:00',
  location: 'Dojo principal',
  lessonPlan: 'Kata Heian et corrections individuelles.',
  notes: 'Prévoir les carnets de grade.',
};

describe('validateSessionInput', () => {
  it('accepts a valid session input', () => {
    expect(validateSessionInput(validSessionInput)).toBeUndefined();
  });

  it.each([
    [{ title: '   ' }, 'Le titre du cours est obligatoire.'],
    [{ date: '' }, 'La date est obligatoire.'],
    [{ startTime: '' }, "L'heure de début est obligatoire."],
    [{ endTime: '' }, "L'heure de fin est obligatoire."],
    [{ startTime: '16:00', endTime: '16:00' }, "L'heure de fin doit être après l'heure de début."],
    [{ startTime: '17:00', endTime: '16:00' }, "L'heure de fin doit être après l'heure de début."],
  ])('returns a French validation message for invalid input %o', (override, expectedMessage) => {
    expect(validateSessionInput({ ...validSessionInput, ...override })).toBe(expectedMessage);
  });
});
