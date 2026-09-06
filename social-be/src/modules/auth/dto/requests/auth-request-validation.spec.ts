import { validate } from 'class-validator';
import {
  Enable2FADto,
  RegisterDto,
  ResetPasswordDto,
  VerifyLogin2FADto,
} from '.';

describe('auth request DTO validation', () => {
  it('accepts a valid registration request', async () => {
    const dto = Object.assign(new RegisterDto(), {
      username: 'test_user',
      email: 'tester@example.com',
      password: 'StrongPass123!',
      dateOfBirth: '2000-01-01',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects non-date-only registration values', async () => {
    const dto = Object.assign(new RegisterDto(), {
      username: 'tester',
      email: 'tester@example.com',
      password: 'StrongPass123!',
      dateOfBirth: '2000-01-01T00:00:00.000Z',
    });

    const errors = await validate(dto);
    expect(errors.some(({ property }) => property === 'dateOfBirth')).toBe(
      true,
    );
  });

  it('rejects password characters outside the supported policy', async () => {
    const dto = Object.assign(new RegisterDto(), {
      username: 'tester',
      email: 'tester@example.com',
      password: 'StrongPass123! ',
      dateOfBirth: '2000-01-01',
    });

    const errors = await validate(dto);
    expect(errors.some(({ property }) => property === 'password')).toBe(true);
  });

  it('validates the email account-code format used by password reset', async () => {
    const validDto = Object.assign(new ResetPasswordDto(), {
      code: 'ABCDE-23456',
      newPassword: 'NewPass123!',
    });
    const invalidDto = Object.assign(new ResetPasswordDto(), {
      code: '123456',
      newPassword: 'NewPass123!',
    });

    await expect(validate(validDto)).resolves.toHaveLength(0);
    expect(
      (await validate(invalidDto)).some(({ property }) => property === 'code'),
    ).toBe(true);
  });

  it('distinguishes a TOTP setup code from a login recovery code', async () => {
    const enableDto = Object.assign(new Enable2FADto(), {
      otp: 'KNT-ABCD-EFGH-JKLM',
    });
    const verifyDto = Object.assign(new VerifyLogin2FADto(), {
      challengeId: 'bff44049-3ac1-4b64-88d7-9087087c4a30',
      otp: 'KNT-ABCD-EFGH-JKLM',
      method: 'recovery_code',
    });

    expect(
      (await validate(enableDto)).some(({ property }) => property === 'otp'),
    ).toBe(true);
    await expect(validate(verifyDto)).resolves.toHaveLength(0);
  });
});
