import { NextResponse } from "next/server";
import { users } from "@/lib/memoryStore";
import { hashPassword } from "@/lib/password";

export async function POST(req) {
  const { username, email, password } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Username, email and password required" },
      { status: 400 }
    );
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  users.push({ 
    id: crypto.randomUUID(), 
    username,  // ← Add username
    email, 
    passwordHash 
  });

  return NextResponse.json({ ok: true });
}