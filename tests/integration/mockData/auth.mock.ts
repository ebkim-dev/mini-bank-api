export type RegisterInput = {
  username: string;
  password: string;
};

export function buildRegisterInput(
  overrides: Partial<RegisterInput> = {}
): RegisterInput {
  return {
    username: `user_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    password: "123123123",
    ...overrides,
  };
}

export type RegisterOutput = {
  id: string;
};

export function buildRegisterOutput(): RegisterOutput {
  return {
    id: expect.any(String) as any,
  };
}

export type LoginInput = {
  username: string;
  password: string;
};

export function buildLoginInput(
  overrides: Partial<LoginInput> = {}
): LoginInput {
  return {
    username: `user_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    password: "123123123",
    ...overrides,
  };
}

export type LoginOutput = {
  token: string;
  expiresIn: number;
};

export function buildLoginOutput(overrides: Partial<LoginOutput> = {}): LoginOutput {
  return {
    token: expect.any(String) as any,
    expiresIn: 3600000,
    ...overrides,
  };
}