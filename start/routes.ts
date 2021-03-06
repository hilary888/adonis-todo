/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from "@ioc:Adonis/Core/Route";

Route.group(() => {
  Route.get("/health_check", "HealthCheckController.healthCheck");
  Route.post("/register", "AuthController.register");
  Route.post("/login", "AuthController.login");
  Route.post("/verify_email", "AuthController.verifyEmail");
  Route.get("/forgot_password", "AuthController.forgotPassword");
  Route.post("/reset_password", "AuthController.resetPassword");

  Route.group(() => {
    Route.post("/logout", "AuthController.logout");
    Route.get("/todos", "TodosController.getTodos");
    Route.put("/todos/:id", "TodosController.updateTodo");
    Route.delete("/todos/:id", "TodosController.deleteTodo");
    Route.post("/todos", "TodosController.createTodo");
  }).middleware(["auth"]);
}).prefix("/api/v1");
