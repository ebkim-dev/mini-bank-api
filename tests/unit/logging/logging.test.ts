describe("logger.ts", () => {
  test("creates a winston logger with timestamp + errors(stack) + json format and Console transport", async () => {
    const mockCombine = jest.fn(() => "COMBINED_FORMAT");
    const mockTimestamp = jest.fn(() => "TIMESTAMP_FORMAT");
    const mockErrors = jest.fn(() => "ERRORS_FORMAT");
    const mockJson = jest.fn(() => "JSON_FORMAT");

    const mockConsoleTransportInstance = { transport: "console" };
    const mockConsoleCtor = jest.fn(() => mockConsoleTransportInstance);

    const mockCreateLogger = jest.fn(() => ({ name: "mockLogger" }));

    jest.doMock("winston", () => ({
      __esModule: true,
      default: {
        createLogger: mockCreateLogger,
        format: {
          combine: mockCombine,
          timestamp: mockTimestamp,
          errors: mockErrors,
          json: mockJson,
        },
        transports: {
          Console: mockConsoleCtor,
        },
      },
    }));
    
    const mod = await import("../../../src/logging/logger");

    expect(mockTimestamp).toHaveBeenCalledTimes(1);
    expect(mockErrors).toHaveBeenCalledTimes(1);
    expect(mockErrors).toHaveBeenCalledWith({ stack: true });
    expect(mockJson).toHaveBeenCalledTimes(1);

    expect(mockCombine).toHaveBeenCalledTimes(1);
    expect(mockCombine).toHaveBeenCalledWith(
      "TIMESTAMP_FORMAT",
      "ERRORS_FORMAT",
      "JSON_FORMAT"
    );

    expect(mockConsoleCtor).toHaveBeenCalledTimes(1);

    expect(mockCreateLogger).toHaveBeenCalledTimes(1);
    expect(mockCreateLogger).toHaveBeenCalledWith({
      format: "COMBINED_FORMAT",
      transports: [mockConsoleTransportInstance],
    });

    expect(mod.logger).toEqual({ name: "mockLogger" });
  });
});