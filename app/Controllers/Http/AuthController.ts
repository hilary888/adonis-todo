import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import EmailVerificationToken from 'App/Models/EmailVerificationToken';
import User from 'App/Models/User';
import CreateUserValidator from 'App/Validators/CreateUserValidator';
import LoginUserValidator from 'App/Validators/LoginUserValidator';
import { v4 as uuidv4 } from 'uuid';


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
            verificationToken: uuidv4()
        };
        try {
            await EmailVerificationToken.create(emailVerificationObject);
        } catch (error) {
            // If emailVerificationToken save fails, rollback user save
            const failedUser = await User.find(user.id);
            if (failedUser !== null) {
                failedUser.delete();
            }

            return response.badRequest({
                status: "fail",
                message: error
            });
        }

        const responseData = {
            status: "success",
            data: user.serialize()
        };
        response.created(responseData);
    }

    public async login({ auth, request, response }: HttpContextContract) {
        const { email, password, rememberMeToken } = await request.validate(LoginUserValidator);

        try {
            const duration: string = rememberMeToken ? "7day" : "1days";

            const token = await auth.use("api").attempt(email, password, {
                expiresIn: duration
            });
            const responseData = {
                status: "success",
                data: token.toJSON(),
            }
            return response.ok(responseData);
        } catch {
            const errorResponse = {
                status: "fail",
                message: "Invalid credentials"
            }
            return response.unauthorized(errorResponse);
        }
    }
}
