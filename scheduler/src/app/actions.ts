'use server'; // Defines this file as a server-side module | i.e, code that runs on the server only

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

// READ actions
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

// CREATE actions

export async function createUser(email: string, user_name: string, fname: string, lname: string) {
    if(! (email && user_name && fname && lname)) {
        throw new Error("All fields are  required to create a user.");
    }
    try {
        const newUser = await prisma.user.create({
            data: { email, user_name, fname, lname },
        });

        revalidatePath('/'); // Revalidate the relevant path (refreshes page to show changes immediately)
        return newUser;

    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}
