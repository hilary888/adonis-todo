// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database";
import Todo from "App/Models/Todo";
import TodoValidator from "App/Validators/TodoValidator";

export default class TodosController {
    public async getTodos({ auth, request, response }) {
        // Get all todo notes belonging to user, paginated
        const { page, per_page } = request.qs();
        const userId = auth.user.id;
        const todos = await Database
            .from("todos")
            .where("user_id", userId)
            .paginate(page, per_page);

        return response.ok({
            status: "success",
            data: todos
        });
    }

    public async createTodo({ auth, request, response }) {
        // Create new todo assigned to user
        const userId = auth.user.id;
        const payload = await request.validate(TodoValidator);
        payload.userId = userId;

        const todo: Todo = await Todo.create(payload);


        return response.created({
            status: "success",
            data: todo
        })
    }

    public async updateTodo({ auth, request, response }) {
        // Edit/Update existing todo assigned to user
        const userId = auth.user.id;
        const todoId = request.params().id;
        const payload = await request.validate(TodoValidator);
        let todo: Todo;
        try {
            todo = await Todo.findOrFail(todoId);
        } catch (error) {
            return response.notFound({
                status: "fail",
                message: error.message
            });
        }

        if (todo.userId !== userId) {
            return response.unauthorized({
                status: "fail",
                message: "todo does not belong to logged-in user"
            });
        }

        todo.title = payload.title;
        todo.content = payload.content;
        const updatedTodo = await todo.save();

        return response.ok({
            status: "success",
            data: updatedTodo
        })


    }

    public async deleteTodo({ auth, request, response }) {
        // Delete user's todo list
        const userId = auth.user.id;
        const todoId = request.params().id;

        let todo: Todo;
        try {
            todo = await Todo.findOrFail(todoId);
        } catch (error) {
            return response.notFound({
                status: "fail",
                message: error.message
            })
        }

        if (todo.userId !== userId) {
            return response.unauthorized({
                status: "fail",
                message: "todo does not belong to logged-in user"
            });
        }

        await todo.delete();

        return response.ok({
            status: "success",
            data: {
                isDeleted: todo.$isDeleted
            }
        })


    }
}
