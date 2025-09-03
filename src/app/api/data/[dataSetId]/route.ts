import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';



/**
 * Handle data query requests by dataset ID
 * GET /api/data/[dataSetId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dataSetId: string }> }
) {
  try {
    const { dataSetId: dataSetIdStr } = await params;
    const dataSetId = parseInt(dataSetIdStr);

    if (isNaN(dataSetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    // First check if dataset exists
    const dataSet = await prisma.dataSet.findUnique({
      where: { id: dataSetId }
    });

    if (!dataSet) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Get all products and their daily records for this dataset
    const products = await prisma.product.findMany({
      where: {
        dataSetId: dataSetId
      },
      include: {
        dailyRecords: {
          orderBy: {
            day: 'asc'
          }
        }
      }
    });

    type ProductWithRecords = {
      id: string;
      name: string;
      dataSetId: number;
      dailyRecords: Array<{
        id: number;
        day: number;
        inventory: number;
        procurementQuantity: number;
        procurementPrice: number;
        procurementAmount: number;
        salesQuantity: number;
        salesPrice: number;
        salesAmount: number;
        productId: string;
      }>;
    };

    // Transform data for chart consumption
    const dayMap = new Map();

    // Collect all unique days
    const allDays = new Set<number>();
    products.forEach((product: ProductWithRecords) => {
      product.dailyRecords.forEach(record => {
        allDays.add(record.day);
      });
    });

    // Sort days
    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Initialize chart data structure
    sortedDays.forEach(day => {
      dayMap.set(day, {
        day,
        inventory: 0,
        salesAmount: 0,
        procurementAmount: 0
      });
    });

    // Aggregate data by day
    products.forEach((product: ProductWithRecords) => {
      product.dailyRecords.forEach(record => {
        const dayData = dayMap.get(record.day);
        if (dayData) {
          dayData.inventory += record.inventory;
          dayData.salesAmount += record.salesQuantity * record.salesPrice;
          dayData.procurementAmount += record.procurementQuantity * record.procurementPrice;
        }
      });
    });

    // Convert to array
    const aggregatedData = Array.from(dayMap.values());

    return NextResponse.json({
      dataSet: {
        id: dataSet.id,
        name: dataSet.name,
        createdAt: dataSet.createdAt
      },
      products: products.map((product: ProductWithRecords) => ({
        id: product.id,
        name: product.name,
        recordCount: product.dailyRecords.length
      })),
      // Raw product data for individual product selection
      rawProducts: products.map((product: ProductWithRecords) => ({
        id: product.id,
        name: product.name,
        dailyRecords: product.dailyRecords
      })),
      // Aggregated chart data (for backward compatibility)
      chartData: aggregatedData,
      summary: {
        totalProducts: products.length,
        totalRecords: products.reduce((sum: number, p: ProductWithRecords) => sum + p.dailyRecords.length, 0),
        dayRange: sortedDays.length > 0 ? {
          start: Math.min(...sortedDays),
          end: Math.max(...sortedDays)
        } : null
      }
    });

  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
