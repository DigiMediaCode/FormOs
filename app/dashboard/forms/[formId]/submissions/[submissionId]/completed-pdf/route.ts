import { NextRequest, NextResponse } from "next/server";
import { generateCompletedSubmissionPdf } from "@/lib/pdf/completed-submission";
import { assertCanGeneratePdf } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";
import { getAppRedirectUrl } from "@/lib/app-url";

type CompletedPdfRouteProps = {
  params: Promise<{
    formId: string;
    submissionId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: CompletedPdfRouteProps,
) {
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  const { formId, submissionId } = await params;
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
      formVersion: true,
      formSnapshot: true,
      data: true,
      files: true,
      signatures: true,
      officeData: true,
      officeCompletedAt: true,
      createdAt: true,
      form: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!submission) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!submission.officeCompletedAt) {
    return new NextResponse("Submission is not completed yet.", { status: 400 });
  }

  try {
    await assertCanGeneratePdf(context.ownerId);
  } catch (error) {
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Completed PDF generation is not included in your current plan.",
      { status: 403 },
    );
  }

  const pdf = await generateCompletedSubmissionPdf({
    formTitle: submission.form.title,
    submissionId: submission.id,
    formVersion: submission.formVersion,
    formSnapshot: submission.formSnapshot,
    data: submission.data,
    officeData: submission.officeData,
    signatures: submission.signatures,
    files: submission.files,
    submittedAt: submission.createdAt,
    completedAt: submission.officeCompletedAt,
    ownerId: context.ownerId,
  });

  return new NextResponse(pdf.buffer, {
    headers: {
      "Content-Type": pdf.mimeType,
      "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
