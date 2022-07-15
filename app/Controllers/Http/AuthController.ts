import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User';
import CreateUserValidator from 'App/Validators/CreateUserValidator';
import LoginUserValidator from 'App/Validators/LoginUserValidator';


export default class AuthController {
    public async register({ request, response }: HttpContextContract) {
        // Validate request payload
        const payload = await request.validate(CreateUserValidator);

        // Create new user
        const user = await User.create(payload);

        const responseData = {
            status: "success",
            data: user.serialize()
        };
        response.created(responseData);
    }

    public async login({ auth, request, response }: HttpContextContract) {
        const { email, password } = await request.validate(LoginUserValidator);

        try {
            const token = await auth.use("api").attempt(email, password);
            const responseData = {
                status: "success",
                data: token,
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