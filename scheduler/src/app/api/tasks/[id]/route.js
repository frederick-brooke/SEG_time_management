import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Delete task
export async function DELETE(request, { params }) {
  try {
    await prisma.task.delete({
      where: { id: params.id },
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
    const body = await request.json();

    // build update data object
    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.completed !== undefined) updateData.completed = body.completed;

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updatedTask,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
