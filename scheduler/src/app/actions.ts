'use server';

import prisma from "lib/prisma";
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            include: {
                tasks: true,
                _count: {
                    select: { tasks: true }
                }
            }
        });
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

export async function getUserByEmail(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tasks: {orderBy: { createdAt: 'desc' } } },
        });
        return user;
    } catch (error) {
        console.error(`Error fetching user with email ${email}:`, error);
        throw error;
    }
}


export async function createUser(email: string, username: string, fname: string, lname: string) {
    if(! (email && username && fname && lname)) {
        throw new Error("All fields are  required to create a user.");
    }
    try {
        const newUser = await prisma.user.create({
            data: { email, username, fname, lname },
        });

        revalidatePath('/');
        return newUser;

    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}
