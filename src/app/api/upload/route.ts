import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '../../../../lib/prisma';

/**
 * Generate a unique product name to avoid conflicts
 * If a product name already exists, append (2), (3), etc.
 * @param tx Prisma transaction client
 * @param baseName Original product name
 * @param dataSetId Dataset ID to scope the uniqueness check
 * @returns Unique product name
 */
async function generateUniqueProductName(
  tx: any,
  baseName: string,
  dataSetId: number
): Promise<string> {
  // First, check if the base name already exists
  const existingProduct = await tx.product.findFirst({
    where: {
      name: baseName,
      dataSetId: dataSetId
    }
  });

  if (!existingProduct) {
    // Base name is available
    return baseName;
  }

  // Find all products with similar names (baseName or baseName(number))
  const similarProducts = await tx.product.findMany({
    where: {
      dataSetId: dataSetId,
      OR: [
        { name: baseName },
        { name: { startsWith: `${baseName}(` } }
      ]
    },
    select: { name: true }
  });

  // Extract numbers from names like "Apple(2)", "Apple(3)"
  const numbers: number[] = [];

  similarProducts.forEach((product: { name: string }) => {
    if (product.name === baseName) {
      numbers.push(1); // The base name counts as (1)
    } else {
      // Extract number from patterns like "Apple(2)"
      const match = product.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\(([0-9]+)\\)$`));
      if (match) {
        numbers.push(parseInt(match[1], 10));
      }
    }
  });

  // Find the next available number
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;

  // If next number is 2, use (2), otherwise use the next available
  if (nextNumber === 2) {
    return `${baseName}(2)`;
  } else {
    return `${baseName}(${nextNumber})`;
  }
}


/**
 * Handle file upload requests
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = rows[0].map(h => String(h).trim());
    const data = rows.slice(1).map(row => {
        const rowData: Record<string, unknown> = {};
        headers.forEach((header, index) => {
            rowData[header] = row[index];
        });
        return rowData;
    });


    // Using a transaction ensures that if any part of the upload fails,
    // the entire operation is rolled back, preventing partial data saves.
    const result: { dataSet: any; createdProducts: any[] } = await prisma.$transaction(async (tx: any) => {
      // 1. Create the DataSet record first
      const dataSet = await tx.dataSet.create({
        data: {
          name: file.name,
        },
      });

      const createdProducts = [];

      // 2. Loop through each row, treating each row as a unique product
      for (const row of data) {
        if (!row['ID'] || !row['Product Name']) {
          continue; // Skip rows that don't have an ID and a Name.
        }
        
        const productIdFromFile = String(row['ID']); // Renamed for clarity
        let productName = String(row['Product Name']);

        // Generate a unique product name to avoid conflicts
        productName = await generateUniqueProductName(tx, productName, dataSet.id);

        // Generate a truly unique product ID to avoid conflicts
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const uniqueProductId = `${dataSet.id}-${productIdFromFile}-${timestamp}-${randomSuffix}`;
        
        const dailyRecordsToCreate = [];
        const openingInventory = parseInt(String(row['Opening Inventory'])) || 0;

        // Add day 0 with opening inventory and zero sales/procurement
        dailyRecordsToCreate.push({
          day: 0,
          inventory: openingInventory,
          procurementQuantity: 0,
          procurementPrice: 0,
          procurementAmount: 0,
          salesQuantity: 0,
          salesPrice: 0,
          salesAmount: 0,
        });

        // Start with opening inventory for day 1 calculations
        let currentInventory = openingInventory;

        // 3. Loop through the days (Day 1, 2, 3 as per the file structure)
        for (let day = 1; day <= 3; day++) {
          const procurementQty = parseInt(String(row[`Procurement Qty (Day ${day})`])) || 0;
          const procurementPrice = parseFloat(String(row[`Procurement Price (Day ${day})`])) || 0;
          const salesQty = parseInt(String(row[`Sales Qty (Day ${day})`])) || 0;
          const salesPrice = parseFloat(String(row[`Sales Price (Day ${day})`])) || 0;

          // Calculate closing inventory for the current day
          const closingInventory = currentInventory + procurementQty - salesQty;

          dailyRecordsToCreate.push({
            day: day,
            inventory: closingInventory, // Use the calculated closing inventory
            procurementQuantity: procurementQty,
            procurementPrice: procurementPrice,
            procurementAmount: procurementQty * procurementPrice,
            salesQuantity: salesQty,
            salesPrice: salesPrice,
            salesAmount: salesQty * salesPrice,
          });

          // Update inventory for the next day's calculation
          currentInventory = closingInventory;
        }

        // 4. Create the product and its associated daily records in one go
        const product = await tx.product.create({
          data: {
            id: uniqueProductId,
            name: productName,
            dataSetId: dataSet.id,
            dailyRecords: {
              create: dailyRecordsToCreate,
            },
          },
          include: {
            dailyRecords: true,
          },
        });
        createdProducts.push(product);
      }

      return { dataSet, createdProducts };
    });

    return NextResponse.json({
      message: 'File uploaded and processed successfully!',
      dataSet: {
        id: result.dataSet.id,
        name: result.dataSet.name,
        createdAt: result.dataSet.createdAt,
      },
      productsCount: result.createdProducts.length,
      recordsCount: result.createdProducts.reduce(
        (sum: number, p: { dailyRecords: unknown[] }) => sum + p.dailyRecords.length,
        0
      ),
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}