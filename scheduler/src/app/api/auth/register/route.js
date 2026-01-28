import { NextResponse } from "next/server";
import { users } from "@/lib/memoryStore";
import { hashPassword } from "@/lib/password";

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 }
    );
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  users.push({ id: crypto.randomUUID(), email, passwordHash });

  return NextResponse.json({ ok: true });
}