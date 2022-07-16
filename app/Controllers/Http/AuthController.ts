import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import EmailVerificationToken from "App/Models/EmailVerificationToken";
import PasswordResetToken from "App/Models/PasswordResetToken";
import User from "App/Models/User";
import CreateUserValidator from "App/Validators/CreateUserValidator";
import EmailVerificationTokenValidator from "App/Validators/EmailVerificationTokenValidator";
import LoginUserValidator from "App/Validators/LoginUserValidator";
import ResetPasswordValidator from "App/Validators/ResetPasswordValidator";
import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    // Validate request payload
    const payload = await request.validate(CreateUserValidator);

    // Create new user
    const user = await User.create(payload); // consider using a transaction instead

    // Make entry into email verification token table
    const emailVerificationObject = {
      userId: user.id,
      email: user.email,
      verificationToken: uuidv4(),
    };

    try {
      await EmailVerificationToken.create(emailVerificationObject);
      // TODO: send mail container verification details here
    } catch (error) {
      // If emailVerificationToken save fails, rollback user save
      const failedUser = await User.find(user.id);
      if (failedUser !== null) {
        failedUser.delete();
      }

      return response.badRequest({
        status: "fail",
        message: error,
      });
    }

    const responseData = {
      status: "success",
      data: user.serialize(),
    };
    console.log("hey");
    response.created(responseData);
  }

  public async login({ auth, request, response }: HttpContextContract) {
    const { email, password, rememberMeToken } = await request.validate(LoginUserValidator);

    try {
      const duration: string = rememberMeToken ? "7day" : "1days";

      const token = await auth.use("api").attempt(email, password, {
        expiresIn: duration,
      });
      const responseData = {
        status: "success",
        data: token.toJSON(),
      };
      return response.ok(responseData);
    } catch {
      const errorResponse = {
        status: "fail",
        message: "Invalid credentials",
      };
      return response.unauthorized(errorResponse);
    }
  }

  public async logout({ auth, response }) {
    // only accessible behind auth middleware
    await auth.use("api").revoke();
    return response.ok({
      status: "success",
      revoked: true,
    });
  }

  public async verifyEmail({ request, response }: HttpContextContract) {
    const { email, verificationToken } = await request.validate(EmailVerificationTokenValidator);
    let emailVerificationTokenRecord: EmailVerificationToken;

    // Find email verification token record
    try {
      emailVerificationTokenRecord = await EmailVerificationToken.findByOrFail("email", email);
    } catch (error) {
      const responseData = {
        status: "fail",
        message: error.message,
      };
      return response.notFound(responseData);
    }

    // Check if provided token matches saved token
    const isValid =
      verificationToken === emailVerificationTokenRecord.verificationToken &&
      emailVerificationTokenRecord !== undefined;
    if (!isValid) {
      return response.badRequest({
        status: "fail",
        message: "email verification failed due to invalid token",
      });
    }

    // Update record
    emailVerificationTokenRecord.isVerified = true;
    emailVerificationTokenRecord.verifiedAt = DateTime.now();
    const verifiedEmail = await emailVerificationTokenRecord.save();

    const responseData = {
      status: "success",
      data: verifiedEmail,
    };

    return response.ok(responseData);
  }

  public async forgotPassword({ request, response }) {
    const { email } = request.qs();
    let user: User;
    try {
      user = await User.findByOrFail("email", email);
    } catch (error) {
      return response.notFound({
        status: "fail",
        message: error.message,
      });
    }

    const passwordResetTokenEntry = {
      userId: user.id,
      token: uuidv4(),
    };

    const result = PasswordResetToken.create(passwordResetTokenEntry);

    return response.ok({
      status: "success",
      data: (await result).$isPersisted,
    });
  }

  public async resetPassword({ request, response }: HttpContextContract) {
    // Enable user reset password
    const { token, newPassword } = await request.validate(ResetPasswordValidator);

    let passwordResetTokenRecord: PasswordResetToken;
    let user: User;

    try {
      passwordResetTokenRecord = await PasswordResetToken.findByOrFail("token", token);
    } catch (error) {
      return response.notFound({
        status: "fail",
        message: error.message,
      });
    }

    try {
      user = await User.findOrFail(passwordResetTokenRecord.userId);
    } catch (error) {
      return response.badRequest({
        status: "fail",
        message: error.message,
      });
    }

    user.password = newPassword;
    await user.save();

    return response.ok({
      status: "success",
      data: { newPasswordSet: user.$isPersisted },
    });
  }
}
