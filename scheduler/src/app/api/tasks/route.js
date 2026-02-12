import { NextResponse } from "next/server"; //used to send HTTP responses back to the client (like JSON data or error messages)
import prisma from "@/lib/prisma"; //This gives you access to interact with your MongoDB database

// Get all tasks for a user
// In Next.js API routes, functions named GET, POST, DELETE, etc. automatically handle those HTTP methods
// request parameter contains information about the incoming HTTP request
export async function GET(request) {
  try {
    // { searchParams } uses destructuring to get just the query parameters part
    const { searchParams } = new URL(request.url); //new URL(request.url) creates a URL object that makes it easy to extract parts of the URL
    const userId = searchParams.get("userId"); //Gets the value of the userId parameter from the URL

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Queries the database to get multiple tasks. prisma.task refers to your Task table in MongoDB
    const tasks = await prisma.tasks.findMany({
      where: { userId }, // only get the tasks where the userId field matches. each user sees their own tasks.
      orderBy: { createdAt: "desc" }, // orders tasks so that the newest tasks are first
    });
    return NextResponse.json({ tasks }); //Sends the tasks back to the client as JSON
  } catch (error) {
    // (error) contains details about what went wrong
    // 500 means Internal Server Error
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

// Post new task
export async function POST(request) {
  try {
    const body = await request.json(); // extracts the JSON data sent in the request body. body now contains the contents of a task
    const task = await prisma.task.create({
      // creates a new task in the database. prisma.task.create() inserts a new record in the tabele.
      data: {
        title: body.title,
        description: body.description,
        dueDate: new Date(body.dueDate),
        userId: body.userId, // sets which user owns this task
        completed: false,
      },
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
