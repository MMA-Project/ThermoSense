import type { RequestHandler } from "express";

import { CreateUserSchema, LoginSchema } from "./user.model";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

class UserController {
  private readonly userService: UserService;

  constructor() {
    const userRepository = new UserRepository();
    this.userService = new UserService(userRepository);
  }

  signup: RequestHandler = async (req, res) => {
    try {
      const validatedData = CreateUserSchema.parse(req.body);
      const user = await this.userService.signup(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  };

  login: RequestHandler = async (req, res) => {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const { token, user } = await this.userService.login(validatedData);
      res.status(200).json({ token, user });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  };

  me: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  };
}

export { UserController };
