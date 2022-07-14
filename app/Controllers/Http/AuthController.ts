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

        response.created()
        return user;
    }

    public async login({ auth, request, response }: HttpContextContract) {
        const { email, password } = await request.validate(LoginUserValidator);

        try {
            const token = await auth.use("api").attempt(email, password);
            return token;
        } catch {
            return response.unauthorized("Invalid credentials");
        }
    }
}
