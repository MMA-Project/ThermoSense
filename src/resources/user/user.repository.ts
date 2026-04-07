import { prisma } from "../../lib/prisma";
import type { CreateUser, User } from "./user.model";

class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return (user as User) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return (user as User) ?? null;
  }

  async create(data: CreateUser): Promise<User> {
    const user = await prisma.user.create({
      data,
    });
    return user as User;
  }
}

export { UserRepository };
