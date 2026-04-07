import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import type { CreateUser, Login, User } from "./user.model";
import { UserRepository } from "./user.repository";

class UserService {
  private readonly userRepository: UserRepository;
  private readonly jwtSecret: string;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET ?? "default-secret-change-me";
  }

  private getDefaultScope(role: string): string[] {
    if (role === "admin") {
      return [
        "measurement:read",
        "alert-threshold:read",
        "alert-threshold:write",
        "actuator:read",
        "actuator:write",
        "sensor:read",
        "sensor:write",
        "zone:read",
        "zone:write",
      ];
    }
    return ["measurement:read", "actuator:read", "sensor:read", "zone:read"];
  }

  async signup(data: CreateUser): Promise<{ token: string; user: Omit<User, "password"> }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const scope = this.getDefaultScope(user.role);
    const token = jwt.sign({ userId: user.id, role: user.role, scope }, this.jwtSecret, {
      expiresIn: "1d",
    });

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async login(data: Login): Promise<{ token: string; user: Omit<User, "password"> }> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const scope = this.getDefaultScope(user.role);
    const token = jwt.sign({ userId: user.id, role: user.role, scope }, this.jwtSecret, {
      expiresIn: "1d",
    });

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async getUserById(id: string): Promise<Omit<User, "password"> | null> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export { UserService };
