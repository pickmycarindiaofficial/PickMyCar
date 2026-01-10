import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';

export interface ExportField {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export const exportToExcel = async (
  data: any[],
  fields: ExportField[],
  filename: string = 'stock-list'
) => {
  try {
    // Transform data to include only selected fields
    const transformedData = data.map(item => {
      const row: any = {};
      fields.forEach(field => {
        const value = getNestedValue(item, field.key);
        row[field.label] = field.format ? field.format(value) : value;
      });
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(transformedData);

    // Auto-size columns
    const colWidths = fields.map(field => ({
      wch: Math.max(field.label.length, 15)
    }));
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock List');

    // Download
    XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const exportToPDF = async (
  data: any[],
  fields: ExportField[],
  filename: string = 'stock-list',
  dealerName?: string
) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Add header
    doc.setFontSize(18);
    doc.text('Stock List', 14, 15);
    
    if (dealerName) {
      doc.setFontSize(12);
      doc.text(`Dealer: ${dealerName}`, 14, 22);
    }
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, dealerName ? 28 : 22);

    // Prepare table data
    const tableData = data.map(item => 
      fields.map(field => {
        const value = getNestedValue(item, field.key);
        return field.format ? field.format(value) : String(value || '');
      })
    );

    // Add table
    autoTable(doc, {
      head: [fields.map(f => f.label)],
      body: tableData,
      startY: dealerName ? 32 : 26,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    // Download
    doc.save(`${filename}-${Date.now()}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

export const exportToWord = async (
  data: any[],
  fields: ExportField[],
  filename: string = 'stock-list',
  dealerName?: string
) => {
  try {
    // Create header
    const children: any[] = [
      new Paragraph({
        text: 'Stock List',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER,
      }),
    ];

    if (dealerName) {
      children.push(
        new Paragraph({
          text: `Dealer: ${dealerName}`,
          alignment: AlignmentType.CENTER,
        })
      );
    }

    children.push(
      new Paragraph({
        text: `Generated on: ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' }) // Empty line
    );

    // Create table
    const tableRows = [
      // Header row
      new TableRow({
        children: fields.map(
          field =>
            new TableCell({
              children: [new Paragraph({ text: field.label })],
              shading: {
                fill: '3B82F6',
              },
            })
        ),
      }),
      // Data rows
      ...data.map(
        item =>
          new TableRow({
            children: fields.map(field => {
              const value = getNestedValue(item, field.key);
              const formattedValue = field.format ? field.format(value) : String(value || '');
              return new TableCell({
                children: [new Paragraph(formattedValue)],
              });
            }),
          })
      ),
    ];

    const table = new Table({
      rows: tableRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });

    children.push(table);

    // Create document
    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${Date.now()}.docx`;
    link.click();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw error;
  }
};

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
