/**
 * Invoice PDF generation — pdfkit, generated on-demand from the order
 * snapshot (never re-priced, never re-fetches product data). No email/SMS
 * delivery here; this only produces the document for download.
 */
import PDFDocument from 'pdfkit';

import type { OrderResponseDto } from '../dto';

const money = (amount: number, currency: string): string => `${currency} ${amount.toFixed(2)}`;

const formatAddress = (a: OrderResponseDto['shippingAddress']): string[] =>
  [
    a.fullName,
    a.addressLine1,
    a.addressLine2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(', '),
    a.country,
    a.phone,
  ].filter((line): line is string => Boolean(line && line.trim()));

/** Builds the invoice PDF and returns it as a Buffer. */
export const buildInvoicePdf = (order: OrderResponseDto): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // -------- Header --------
    doc.fontSize(20).font('Helvetica-Bold').text('NDH Trendgrid', { continued: false });
    doc.fontSize(10).font('Helvetica').fillColor('#555').text('Tax Invoice');
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text('Invoice');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice #: ${order.invoiceNumber}`);
    doc.text(`Order #: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.placedAt).toLocaleDateString()}`);
    doc.text(`Payment status: ${order.paymentStatus}`);
    doc.moveDown();

    // -------- Bill to / Ship to --------
    const colY = doc.y;
    doc.font('Helvetica-Bold').text('Billed to', 50, colY);
    doc.font('Helvetica').text(formatAddress(order.billingAddress).join('\n'), 50, doc.y);

    doc.font('Helvetica-Bold').text('Shipped to', 320, colY);
    doc.font('Helvetica').text(formatAddress(order.shippingAddress).join('\n'), 320, colY + 15);

    doc.moveDown(2);

    // -------- Line items table --------
    const tableTop = doc.y;
    const cols = { name: 50, qty: 320, price: 380, total: 460 };

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', cols.name, tableTop);
    doc.text('Qty', cols.qty, tableTop, { width: 40, align: 'right' });
    doc.text('Unit price', cols.price, tableTop, { width: 70, align: 'right' });
    doc.text('Line total', cols.total, tableTop, { width: 70, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#ccc').stroke();

    let y = tableTop + 22;
    doc.font('Helvetica').fontSize(9);
    for (const item of order.items) {
      const label = [item.productName, item.colorName, item.sizeName].filter(Boolean).join(' — ');
      doc.text(label, cols.name, y, { width: 260 });
      doc.text(String(item.quantity), cols.qty, y, { width: 40, align: 'right' });
      doc.text(money(item.unitPrice, order.currency), cols.price, y, { width: 70, align: 'right' });
      doc.text(money(item.lineTotal, order.currency), cols.total, y, { width: 70, align: 'right' });
      y += 18;
    }
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
    y += 10;

    // -------- Totals --------
    const totalsRow = (label: string, value: string, bold = false): void => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      doc.text(label, 380, y, { width: 90, align: 'right' });
      doc.text(value, 460, y, { width: 70, align: 'right' });
      y += 16;
    };

    totalsRow('Subtotal', money(order.subtotal, order.currency));
    if (order.discountAmount > 0) totalsRow('Discount', `-${money(order.discountAmount, order.currency)}`);
    if (order.couponCode) totalsRow(`Coupon (${order.couponCode})`, `-${money(order.couponDiscount, order.currency)}`);
    totalsRow('Shipping', money(order.shippingCharge, order.currency));
    totalsRow('Tax', money(order.taxAmount, order.currency));
    y += 4;
    totalsRow('Grand total', money(order.grandTotal, order.currency), true);

    // -------- Footer --------
    doc
      .fontSize(8)
      .fillColor('#888')
      .text(
        'This is a system-generated invoice and does not require a signature.',
        50,
        780,
        { align: 'center', width: 495 },
      );

    doc.end();
  });
