import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

/**
 * Handle datasets listing requests
 * GET /api/datasets
 */
export async function GET() {
  try {
    const datasets = await prisma.dataSet.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return NextResponse.json({
      datasets: datasets.map(dataset => ({
        id: dataset.id,
        name: dataset.name,
        createdAt: dataset.createdAt,
        productCount: dataset._count.products
      }))
    });

  } catch (error) {
    console.error('Datasets fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}
