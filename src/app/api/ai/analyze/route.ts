import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Helper function to clean and validate the API key.
function normalizeApiKey(raw?: string) {
  const s = (raw ?? "")
    .trim()
    .replace(/^[“”"']|[“”"']$/g, "");
  if (!s) throw new Error("GEMINI_API_KEY is missing");
  if (/[^\x00-\x7F]/.test(s)) {
    throw new Error(
      "GEMINI_API_KEY contains non-ASCII characters (likely smart quotes). Please paste the key without any quotes."
    );
  }
  return s;
}

// Initialize the Google Generative AI client.
const genAI = new GoogleGenerativeAI(
  normalizeApiKey(process.env.GEMINI_API_KEY)
);

export async function POST(req: NextRequest) {
  try {
    const { dataSetId, userQuestion } = await req.json();

    // Validate incoming request body.
    if (!dataSetId || !userQuestion) {
      return NextResponse.json(
        { error: "Missing dataset ID or user question" },
        { status: 400 }
      );
    }

    // Lazily import PrismaClient to improve cold start times.
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      // Fetch the dataset and all its related products and their daily records.
      const dataSet = await prisma.dataSet.findUnique({
        where: { id: parseInt(dataSetId) },
        include: {
          products: {
            include: {
              dailyRecords: {
                orderBy: { day: 'asc' }
              }
            }
          }
        }
      });

      if (!dataSet) {
        return NextResponse.json(
          { error: "Dataset not found" },
          { status: 404 }
        );
      }
      
      // Helper function to clean user input strings from common non-standard characters.
      const clean = (str: string): string =>
        String(str)
          .replace(/[\u2018\u2019]/g, "'") // ’ ‘
          .replace(/[\u201C\u201D]/g, '"') // " "
          .replace(/[\u2013\u2014]/g, "-") // – —
          .replace(/\u2026/g, "...") // …
          .trim();

      // --- PROMPT ENGINEERING: REVISED FOR DETAILED ANALYSIS ---
      const prompt = [
        // 1. Set the role and overall goal.
        "You are an expert data analyst. Your task is to analyze the provided dataset to answer the user's question accurately and concisely.",
        "Provide direct answers. Perform calculations if necessary. Do not mention that you are an AI.",
        "",
        // 2. Provide the full dataset context.
        "Here is the dataset you are analyzing:",
        `{`,
        `  "datasetName": "${dataSet.name}",`,
        `  "products": [`,
      ];

      // 3. **THE KEY CHANGE**: Instead of just summaries, provide the full daily records for each product.
      // We format the data as a JSON string for clarity and easy parsing by the model.
      dataSet.products.forEach((product: { name: string; dailyRecords: { salesAmount: number; procurementAmount: number }[] }, index: number) => {
        // We can still calculate summaries and provide them for context, which can help the model.
        const totalSales = product.dailyRecords.reduce((sum, record) => sum + record.salesAmount, 0);
        const totalProcurement = product.dailyRecords.reduce((sum, record) => sum + record.procurementAmount, 0);

        prompt.push(`    {`);
        prompt.push(`      "productName": "${product.name}",`);
        prompt.push(`      "summary": {`);
        prompt.push(`        "totalSales": ${totalSales.toFixed(2)},`);
        prompt.push(`        "totalProcurement": ${totalProcurement.toFixed(2)}`);
        prompt.push(`      },`);
        prompt.push(`      "dailyData": ${JSON.stringify(product.dailyRecords, null, 2)}`);
        prompt.push(`    }${index === dataSet.products.length - 1 ? '' : ','}`); // Add comma if not the last item
      });

      prompt.push(`  ]`);
      prompt.push(`}`);
      prompt.push("");

      // 4. State the user's question clearly.
      prompt.push(`Based on the complete dataset above, answer the following question:`);
      prompt.push(`"${clean(userQuestion)}"`);

      const fullPrompt = prompt.join("\n");

      // 5. Generate content using the AI model.
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      });

      const text = result.response.text();

      // 6. Return the AI's answer and some metadata about the dataset.
      return NextResponse.json({
        answer: text,
        dataSummary: {
          datasetName: dataSet.name,
          totalProducts: dataSet.products.length,
          dateCreated: dataSet.createdAt,
          totalRecords: dataSet.products.reduce((sum: number, product: { dailyRecords: { length: number } }) => sum + product.dailyRecords.length, 0)
        }
      });
    } catch (prismaErr: unknown) {
      console.error("Database error:", prismaErr);
      return NextResponse.json(
        { error: "Failed to fetch dataset from database" },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    console.error("Error calling Gemini API:", (err && typeof err === "object" && "stack" in err ? err.stack : err));
    const msg =
      (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message.includes("GEMINI_API_KEY"))
        ? err.message
        : "An internal error occurred with the AI analysis service";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}