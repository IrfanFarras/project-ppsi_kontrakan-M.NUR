import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { generateToken } from "../utils/auth.util";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new AppError(400, "Email sudah terdaftar");
    }

    // Public registration tidak boleh mendaftarkan OWNER
    const role = input.role === "OWNER" ? "TENANT" : (input.role ?? "TENANT");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role,
      },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new AppError(401, "Email atau password salah");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, "Email atau password salah");
    }

    const token = generateToken({ userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError(404, "User tidak ditemukan");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
