// /api/auth/* — email + password accounts: register, sign in, sign out and forgotten passwords.
import * as PasswordReset from '../models/passwordReset.model.js';
import * as User from '../models/user.model.js';
import { HttpError } from '../utils/HttpError.js';
import { appUrl, mailReady, sendMail } from '../utils/mailer.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { endSession, startSession } from '../utils/session.js';
import { cleanEmail } from '../validators/email.validator.js';
import { passwordProblem } from '../validators/password.validator.js';
import { cleanName } from '../validators/user.validator.js';
import { userView } from '../views/user.view.js';

// POST /api/auth/register { name, email, password } — creates the account and signs it in.
export async function register(request, response) {
  const name = cleanName(request.body.name);
  const email = cleanEmail(request.body.email);
  const problem = passwordProblem(request.body.password);
  if (problem) throw new HttpError(400, problem);
  const user = await User.create({ email, name, passwordHash: await hashPassword(request.body.password) });
  startSession(request, response, user);
  response.status(201).json({ user: userView(user) });
}

// POST /api/auth/login { email, password }
export async function login(request, response) {
  const email = cleanEmail(request.body.email);
  const user = await User.findByEmail(email);
  if (!user || !await verifyPassword(String(request.body.password ?? ''), user.password_hash)) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  startSession(request, response, user);
  response.json({ user: userView(user) });
}

export function logout(request, response) {
  endSession(request, response);
  response.json({ ok: true });
}

// POST /api/auth/forgot-password { email } — emails a one-time link for choosing a new password.
// The answer is the same whether or not the email has an account.
export async function forgotPassword(request, response) {
  const email = cleanEmail(request.body.email);
  if (!mailReady()) throw new HttpError(503, 'We can’t send emails just yet. Write to hello@yourecom.in and we’ll help you back into your account.');
  const user = await User.findByEmail(email);
  if (user) {
    const token = await PasswordReset.create(user.id);
    await sendMail({
      to: user.email,
      subject: 'Reset your YourEcom password',
      text: [
        `Hello ${user.name.split(' ')[0]},`,
        `To choose a new password for your YourEcom account, open this link within ${PasswordReset.LINK_MINUTES} minutes:`,
        `${appUrl()}/reset-password?token=${token}`,
        'If you didn’t ask for this, ignore this email and your password stays the same.',
        'YourEcom',
      ].join('\n\n'),
    });
  }
  response.json({ ok: true });
}

// POST /api/auth/reset-password { token, password } — sets the new password from an emailed link,
// signs the account out everywhere else and signs this browser in. Each link works once, and the
// password is checked first so a too-short one doesn't use the link up.
export async function resetPassword(request, response) {
  const problem = passwordProblem(request.body.password);
  if (problem) throw new HttpError(400, problem);
  const userId = await PasswordReset.use(request.body.token);
  if (!userId) throw new HttpError(400, 'This reset link has expired or has already been used. Ask for a new one.');
  const user = await User.updatePassword(userId, await hashPassword(request.body.password));
  await PasswordReset.removeForUser(userId);
  startSession(request, response, user);
  response.json({ user: userView(user) });
}
