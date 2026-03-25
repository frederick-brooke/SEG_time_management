export const Icon = jest.fn().mockImplementation((opts: Record<string, unknown>) => ({ ...opts, _isIcon: true }));
