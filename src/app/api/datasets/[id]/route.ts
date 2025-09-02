import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

/**
 * Handle dataset operations by ID
 * PUT /api/datasets/[id] - Update dataset name
 * DELETE /api/datasets/[id] - Delete dataset and related data
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const datasetId = parseInt(idStr);

    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Dataset name is required' },
        { status: 400 }
      );
    }

    // Check if dataset exists
    const existingDataset = await prisma.dataSet.findUnique({
      where: { id: datasetId }
    });

    if (!existingDataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another dataset
    const duplicateDataset = await prisma.dataSet.findFirst({
      where: {
        name: name.trim(),
        id: { not: datasetId }
      }
    });

    if (duplicateDataset) {
      return NextResponse.json(
        { error: 'Dataset name already exists' },
        { status: 409 }
      );
    }

    // Update dataset
    const updatedDataset = await prisma.dataSet.update({
      where: { id: datasetId },
      data: { name: name.trim() },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Dataset updated successfully',
      dataset: {
        id: updatedDataset.id,
        name: updatedDataset.name,
        createdAt: updatedDataset.createdAt,
        productCount: updatedDataset._count.products
      }
    });

  } catch (error) {
    console.error('Update dataset error:', error);
    return NextResponse.json(
      { error: 'Failed to update dataset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const datasetId = parseInt(idStr);

    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    // Check if dataset exists
    const dataset = await prisma.dataSet.findUnique({
      where: { id: datasetId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Delete dataset (this will cascade delete all related products and daily records)
    await prisma.dataSet.delete({
      where: { id: datasetId }
    });

    return NextResponse.json({
      message: 'Dataset deleted successfully',
      deletedDataset: {
        id: datasetId,
        name: dataset.name,
        productCount: dataset._count.products
      }
    });

  } catch (error) {
    console.error('Delete dataset error:', error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
