import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

// Delete task
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // ADD THESE DEBUG LOGS
    console.log("=== TASK UPDATE DEBUG ===");
    console.log("Task ID:", id);
    console.log("Body received:", JSON.stringify(body, null, 2));
    console.log("Body.status:", body.status);
    console.log("Body.completed:", body.completed);
    await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

// patch (update) task
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // build update data object
    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.subtasks !== undefined) updateData.subtasks = body.subtasks;
    //handle status updates and synce with completed field
    if (body.status !== undefined){
      updateData.status = body.status;
      if (body.status == "completed"){
        updateData.completed = true;
        updateData.completedAt = new Date();
      } else {
        updateData.completed = false;
        updateData.completedAt = null
      }
    }
    //handle direct completed updates
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
      updateData.status = body.completed ? "completed" : "todo";
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
