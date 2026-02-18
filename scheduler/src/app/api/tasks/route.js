import { NextResponse } from "next/server"; //used to send HTTP responses back to the client (like JSON data or error messages)
import prisma from "@/src/lib/prisma"; //This gives you access to interact with your MongoDB database

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
    const tasks = await prisma.task.findMany({
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
    const body = await request.json();
    
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        dueDate: new Date(body.dueDate),
        userId: body.userId,
        completed: false,
        priority: body.priority || "Low",
        duration: body.duration || 0,
        subtasks: body.subtasks || [],
      },
    });
    
    console.log("=== TASK CREATED ===");
    console.log("Task:", JSON.stringify(task, null, 2));
    return NextResponse.json({ task });
  } catch (error) {
    console.error("=== ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}