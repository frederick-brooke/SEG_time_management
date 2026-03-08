import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "No session found. Please log in." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const completed = searchParams.get("completed");

  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = {
    AND: [
      {
        userId: session.user.id
      }
    ]
  };

  // search by title
  if (search.trim() !== "") {
    where.AND.push({
      title: {
        contains: search,
        mode: "insensitive"
      }
    });
  }

  // filter by status
  if (status) {
    where.AND.push({
      status: status
    });
  }

  // filter by priority
  if (priority) {
    where.AND.push({
      priority: priority
    });
  }

  // completed filter
  if (completed === "true") {
    where.AND.push({
      completed: true
    });
  }

  if (completed === "false") {
    where.AND.push({
      completed: false
    });
  }

  // due date filter
  if (startDate || endDate) {

    const dateFilter: any = {};

    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }

    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    where.AND.push({
      dueDate: dateFilter
    });

  }

  const [tasks, totalMatchingTasks] = await Promise.all([

    prisma.task.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit
    }),

    prisma.task.count({ where })

  ]);

  return NextResponse.json({
    tasks,
    totalTasks: totalMatchingTasks,
    totalTaskPages: Math.ceil(totalMatchingTasks / limit)
  });
}