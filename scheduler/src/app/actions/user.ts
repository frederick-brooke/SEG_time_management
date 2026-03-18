'use server';

import { prisma } from "lib/prisma";
import { revalidatePath } from 'next/cache';

/**
 * Fetches all users from the database with their tasks and task counts
 * Used for admin panels, user listings, or leaderboards
 * @returns Array of user objects with tasks and task counts
 * @throws {Error} - If database query fails
 */
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                isDeleted:false
            },
            
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

/**
 * Fetches a single user by their email address with all their tasks
 * Tasks are ordered by creation date (newest first)
 * Used for authentication flows and user lookups
 * @param email - The user's email address
 * @returns {Promise<Object | null>} - User object with tasks, or null if not found
 * @throws {Error} - If database query fails
 */
export async function getUserByEmail(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tasks: { orderBy: { createdAt: 'desc' } } },
        });
        return user;
    } catch (error) {
        console.error(`Error fetching user with email ${email}:`, error);
        throw error;
    }
}

/**
 * Creates a new user in the database
 * Used during registration or first-time OAuth sign-in
 * @param  email - User's email address (required)
 * @param username - Unique username (required)
 * @param fname - First name (required)
 * @param lname - Last name (required)
 * @returns {Promise<Object>} - The newly created user object
 * @throws {Error} - If any required field is missing or database insert fails
 */
export async function createUser(email: string, username: string, fname: string, lname: string) {
    if (!email || !username || !fname || !lname) {
        throw new Error("All fields are required to create a user.");
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