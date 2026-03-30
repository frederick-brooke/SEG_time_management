/**
 * Testing for lib/actions
 */

import { addEventAction } from 'lib/actions';

// Mocks 

jest.mock('lib/prisma', () => ({
  __esModule: true,
  default: {
    event: {
      create: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

//  Imports after mocking 

import prisma from 'lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

//  Helpers 

const mockPrismaCreate = prisma.event.create as jest.Mock;
const mockGetServerSession = getServerSession as jest.Mock;
const mockRevalidatePath = revalidatePath as jest.Mock;

function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const validFields = {
  title: 'Team Standup',
  description: 'Daily sync',
  start: '2025-06-01T09:00:00.000Z',
  end: '2025-06-01T09:30:00.000Z',
};

//  Tests 

describe('addEventAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockPrismaCreate.mockResolvedValue({ id: 'event-abc' });
  });

  describe('success cases', () => {
    it('creates an event and returns { success: true }', async () => {
      const result = await addEventAction(buildFormData(validFields));

      expect(result).toEqual({ success: true });
    });

    it('calls prisma.event.create with correct data', async () => {
      await addEventAction(buildFormData(validFields));

      expect(mockPrismaCreate).toHaveBeenCalledTimes(1);
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          title: 'Team Standup',
          description: 'Daily sync',
          start: new Date('2025-06-01T09:00:00.000Z'),
          end: new Date('2025-06-01T09:30:00.000Z'),
          allDay: false,
          category: 'GENERAL',
          user: { connect: { id: 'user-123' } },
        },
      });
    });

    it('calls revalidatePath("/calendar") after creating the event', async () => {
      await addEventAction(buildFormData(validFields));

      expect(mockRevalidatePath).toHaveBeenCalledWith('/calendar');
    });

    it('works when description is omitted (optional field)', async () => {
      const { description: _omit, ...withoutDesc } = validFields;
      const result = await addEventAction(buildFormData(withoutDesc));

      expect(result).toEqual({ success: true });
      expect(mockPrismaCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: null }),
        })
      );
    });
  });

  // Validation errors

  describe('missing field validation', () => {
    it('returns { error: "Missing fields" } when title is missing', async () => {
      const { title: _omit, ...rest } = validFields;
      const result = await addEventAction(buildFormData(rest));

      expect(result).toEqual({ error: 'Missing fields' });
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('returns { error: "Missing fields" } when start is missing', async () => {
      const { start: _omit, ...rest } = validFields;
      const result = await addEventAction(buildFormData(rest));

      expect(result).toEqual({ error: 'Missing fields' });
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('returns { error: "Missing fields" } when end is missing', async () => {
      const { end: _omit, ...rest } = validFields;
      const result = await addEventAction(buildFormData(rest));

      expect(result).toEqual({ error: 'Missing fields' });
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('returns { error: "Missing fields" } when title is an empty string', async () => {
      const result = await addEventAction(
        buildFormData({ ...validFields, title: '' })
      );

      expect(result).toEqual({ error: 'Missing fields' });
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('returns { error: "Missing fields" } when all required fields are absent', async () => {
      const result = await addEventAction(new FormData());

      expect(result).toEqual({ error: 'Missing fields' });
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });
  });

  // Database errors 

  describe('database error handling', () => {
    it('returns { error: "Failed to create event" } when prisma throws', async () => {
      mockPrismaCreate.mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await addEventAction(buildFormData(validFields));

      expect(result).toEqual({ error: 'Failed to create event' });
    });

    it('does NOT call revalidatePath when prisma throws', async () => {
      mockPrismaCreate.mockRejectedValueOnce(new Error('Constraint violation'));

      await addEventAction(buildFormData(validFields));

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('logs the error to console.error when prisma throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const dbError = new Error('Unique constraint failed');
      mockPrismaCreate.mockRejectedValueOnce(dbError);

      await addEventAction(buildFormData(validFields));

      expect(consoleSpy).toHaveBeenCalledWith('Database Error:', dbError);
      consoleSpy.mockRestore();
    });
  });

  // Session / user binding 

  describe('session handling', () => {
    it('connects the event to the authenticated user id', async () => {
      mockGetServerSession.mockResolvedValueOnce({ user: { id: 'user-xyz' } });

      await addEventAction(buildFormData(validFields));

      expect(mockPrismaCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: { connect: { id: 'user-xyz' } },
          }),
        })
      );
    });
  });

  // Date coercion 

  describe('date parsing', () => {
    it('converts start and end strings to Date objects', async () => {
      const startStr = '2025-12-25T08:00:00.000Z';
      const endStr = '2025-12-25T09:00:00.000Z';

      await addEventAction(
        buildFormData({ ...validFields, start: startStr, end: endStr })
      );

      const callArg = mockPrismaCreate.mock.calls[0][0];
      expect(callArg.data.start).toEqual(new Date(startStr));
      expect(callArg.data.end).toEqual(new Date(endStr));
    });
  });
});
