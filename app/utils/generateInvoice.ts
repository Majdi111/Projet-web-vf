import type { Client, Order } from "@/types/index";
import { db } from "@/lib/firebaseClient";
import type { jsPDF as JsPdfDoc } from "jspdf";
import type { UserOptions as AutoTableUserOptions } from "jspdf-autotable";

export type InvoicePdfOptions = {
  logoUrl?: string;
  company?: InvoicePdfCompany;
};

export type InvoicePdfCompany = {
  name?: string;
  email?: string;
  phoneNumbers?: string[];
  addresses?: string[];
};

export type InvoicePdfItem = {
  id?: string;
  productId?: string;
  reference?: string;
  sku?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
};

export type InvoicePdfClient = {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
};

export type InvoicePdfData = {
  invoiceNumber?: string;
  issueDate?: Date;
  dueDate?: Date;
  createdAt?: Date | string | number;
  status?: string;
  clientCIN?: string;
  client: InvoicePdfClient;
  items: InvoicePdfItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
};

const DEFAULT_LOGO_URL = "/company/company_logo.png";
const BRAND_GRAY: [number, number, number] = [75, 85, 99];
const BRAND_GRAY_DARK: [number, number, number] = [31, 41, 55];
const BORDER_GRAY: [number, number, number] = [220, 220, 220];
const BG_SOFT: [number, number, number] = [245, 247, 250];
const TEXT_MUTED: [number, number, number] = [107, 114, 128];
const CURRENCY = "Dt";

const formatMoneyDt = (value: number) => `${Number(value || 0).toFixed(2)} ${CURRENCY}`;

const toDateSafe = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
};

const loadCompanyProfileFromStorage = (): InvoicePdfCompany | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("companyProfile");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      name?: unknown;
      email?: unknown;
      phoneNumbers?: unknown;
      addresses?: unknown;
    };

    const phoneNumbers = Array.isArray(parsed.phoneNumbers)
      ? (parsed.phoneNumbers as unknown[]).map((p) => String(p ?? "").trim()).filter(Boolean)
      : undefined;
    const addresses = Array.isArray(parsed.addresses)
      ? (parsed.addresses as unknown[]).map((a) => String(a ?? "").trim()).filter(Boolean)
      : undefined;

    const company: InvoicePdfCompany = {
      name: typeof parsed.name === "string" ? parsed.name.trim() : undefined,
      email: typeof parsed.email === "string" ? parsed.email.trim() : undefined,
      phoneNumbers: phoneNumbers?.length ? phoneNumbers : undefined,
      addresses: addresses?.length ? addresses : undefined,
    };

    if (!company.name && !company.email && !company.phoneNumbers?.length && !company.addresses?.length) return undefined;
    return company;
  } catch {
    return undefined;
  }
};

const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });

    return dataUrl;
  } catch {
    return null;
  }
};

const getImageAspectRatio = async (dataUrl: string): Promise<number | null> => {
  if (typeof window === "undefined") return null;
  try {
    const ratio = await new Promise<number>((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const w = Number(img.naturalWidth || img.width || 0);
        const h = Number(img.naturalHeight || img.height || 0);
        if (!w || !h) return reject(new Error("Invalid image size"));
        resolve(w / h);
      };
      img.src = dataUrl;
    });

    if (!Number.isFinite(ratio) || ratio <= 0) return null;
    return ratio;
  } catch {
    return null;
  }
};

const loadProductReferenceMap = async (productIds: string[]): Promise<Record<string, string>> => {
  if (typeof window === "undefined") return {};
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  try {
    const firestore = await import("firebase/firestore");
    const { doc, getDoc } = firestore;

    const entries = await Promise.all(
      uniqueIds.map(async (productId) => {
        try {
          const snap = await getDoc(doc(db, "products", productId));
          if (!snap.exists()) return [productId, productId] as const;
          const data = snap.data() as { reference?: string };
          return [productId, (data.reference ?? snap.id) as string] as const;
        } catch {
          return [productId, productId] as const;
        }
      })
    );

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
};

type KeyValueRow = {
  label: string;
  value: string;
};

type DrawSectionBoxParams = { x: number; y: number; w: number; title: string; rows: KeyValueRow[] };

const drawSectionBox = (doc: JsPdfDoc, params: DrawSectionBoxParams) => {
  const { x, y, w, title, rows } = params;
  const padX = 4;
  const padY = 4;
  const headerH = 9;
  const rowGap = 4.8;
  const labelW = 24;
  const valueW = w - padX * 2 - labelW;

  const wrappedValues: Array<{ label: string; valueLines: string[] }> = rows.map((r) => ({
    label: r.label,
    valueLines: doc.splitTextToSize(String(r.value ?? "").trim() || "-", valueW) as string[],
  }));
  const contentLines = wrappedValues.reduce((sum, r) => sum + (r.valueLines.length || 1), 0);
  const h = padY + headerH + padY + contentLines * rowGap + padY;

  doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2);

  doc.setFillColor(BG_SOFT[0], BG_SOFT[1], BG_SOFT[2]);
  doc.rect(x, y, w, headerH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(title, x + padX, y + 6.3);

  let cursorY = y + headerH + padY + 2;
  wrappedValues.forEach((r) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(r.label, x + padX, cursorY);

    doc.setFont("times", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(20, 20, 20);
    r.valueLines.forEach((line, idx) => {
      doc.text(String(line), x + padX + labelW, cursorY + idx * rowGap);
    });

    cursorY += (r.valueLines?.length ?? 1) * rowGap;
  });

  doc.setTextColor(0, 0, 0);
  return { h };
};

export async function generateInvoicePDF(client: Client, order: Order, options?: InvoicePdfOptions): Promise<void>;
export async function generateInvoicePDF<T extends InvoicePdfData>(invoice: T, options?: InvoicePdfOptions): Promise<void>;
export async function generateInvoicePDF(arg1: unknown, arg2?: unknown, arg3?: unknown): Promise<void> {
  if (typeof window === "undefined") return;

  const isClientOrderCall = Boolean(arg2) && typeof arg2 === "object";
  const optionsCandidate = isClientOrderCall ? arg3 : arg2;
  const options: InvoicePdfOptions | undefined =
    optionsCandidate && typeof optionsCandidate === "object" ? (optionsCandidate as InvoicePdfOptions) : undefined;

  const invoice: InvoicePdfData = isClientOrderCall
    ? (() => {
        const client = arg1 as Client;
        const order = arg2 as Order;
        return {
          invoiceNumber: order.orderNumber,
          createdAt: order.createdAt,
          clientCIN: client.cin,
          client: {
            name: client.name,
            email: client.email,
            phone: client.phone,
            location: client.location,
          },
          items: (order.items ?? []).map((item) => ({
            id: item.id,
            productId: item.productId,
            description: item.description,
            quantity: Number(item.quantity ?? 0),
            unitPrice: Number(item.unitPrice ?? 0),
            totalPrice: Number(item.totalPrice ?? 0),
          })),
          subtotal: order.subtotal,
          taxRate: order.taxRate,
          taxAmount: order.taxAmount,
          totalAmount: Number(order.totalAmount ?? 0),
          notes: undefined,
        } satisfies InvoicePdfData;
      })()
    : (arg1 as InvoicePdfData);

  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = (autoTableModule as {
    default: (doc: JsPdfDoc, options: AutoTableUserOptions) => void;
  }).default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const footerY = pageHeight - 10;

  const logoUrl = options?.logoUrl ?? DEFAULT_LOGO_URL;
  const logoDataUrl = await loadImageAsDataUrl(logoUrl);

  const company = options?.company ?? loadCompanyProfileFromStorage();

  // Header band (logo + title)
  const headerTop = 0;
  const headerBandH = 26;

  doc.setFillColor(BRAND_GRAY_DARK[0], BRAND_GRAY_DARK[1], BRAND_GRAY_DARK[2]);
  doc.rect(0, headerTop, pageWidth, headerBandH, "F");

  if (logoDataUrl) {
    try {
      const logoMaxH = 20;
      const logoMaxW = 34;
      const aspectRatio = await getImageAspectRatio(logoDataUrl);

      let logoW = logoMaxH;
      let logoH = logoMaxH;

      if (aspectRatio) {
        logoW = logoMaxH * aspectRatio;
        logoH = logoMaxH;

        if (logoW > logoMaxW) {
          logoW = logoMaxW;
          logoH = logoMaxW / aspectRatio;
        }
      }

      doc.addImage(logoDataUrl, "PNG", pageWidth - marginX - logoW, 5, logoW, logoH);
    } catch {
      // ignore logo failures
    }
  }

  // Company block (top-left)
  if (company && (company.name || company.email || (company.phoneNumbers?.length ?? 0) > 0 || (company.addresses?.length ?? 0) > 0)) {
    const centerGap = 12;
    const maxLeftHalfW = pageWidth / 2 - marginX - centerGap;
    const blockW = Math.max(40, Math.min(70, maxLeftHalfW));
    const textX = marginX;
    const maxW = blockW;
    const lineGap = 4.2;
    let y = 8;

    const phones = (company.phoneNumbers ?? []).map((p) => String(p ?? "").trim()).filter(Boolean);
    const addresses = (company.addresses ?? []).map((a) => String(a ?? "").trim()).filter(Boolean);

    doc.setTextColor(255, 255, 255);

    if (company.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.6);
      const nameLines = doc.splitTextToSize(String(company.name).trim(), maxW);
      (nameLines as string[]).slice(0, 2).forEach((line) => {
        doc.text(String(line), textX, y, { align: "left" });
        y += lineGap;
      });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);

    if (company.email) {
      const emailLines = doc.splitTextToSize(String(company.email).trim(), maxW);
      (emailLines as string[]).slice(0, 2).forEach((line) => {
        doc.text(String(line), textX, y, { align: "left" });
        y += lineGap;
      });
    }

    if (phones.length) {
      const phoneLine = phones.join(" / ");
      const phoneLines = doc.splitTextToSize(phoneLine, maxW);
      (phoneLines as string[]).slice(0, 2).forEach((line) => {
        doc.text(String(line), textX, y, { align: "left" });
        y += lineGap;
      });
    }

    if (addresses.length) {
      const addrLine = addresses.join(" · ");
      const addrLines = doc.splitTextToSize(addrLine, maxW);
      (addrLines as string[]).slice(0, 2).forEach((line) => {
        doc.text(String(line), textX, y, { align: "left" });
        y += lineGap;
      });
    }

    doc.setTextColor(0, 0, 0);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", pageWidth / 2, 16, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "normal");
  doc.setFontSize(10);

  const issueDate = toDateSafe(invoice.issueDate) ?? toDateSafe(invoice.createdAt) ?? new Date();
  const dueDate = toDateSafe(invoice.dueDate);
  const invoiceNumber = invoice.invoiceNumber ?? "";
  const status = invoice.status ?? "";

  // Details + Bill To (boxed, aligned)
  const contentTop = headerBandH + 10;
  const boxGap = 8;
  const halfWidth = (pageWidth - marginX * 2 - boxGap) / 2;
  const leftBoxX = marginX;
  const rightBoxX = marginX + halfWidth + boxGap;

  const leftRows: KeyValueRow[] = [
    { label: "Invoice :", value: invoiceNumber || "-" },
    { label: "Issue :", value: issueDate.toLocaleDateString() },
    ...(dueDate ? ([{ label: "Due :", value: dueDate.toLocaleDateString() }] as KeyValueRow[]) : []),
    ...(status ? ([{ label: "Status :", value: status }] as KeyValueRow[]) : []),
  ];

  const rightRows: KeyValueRow[] = [
    { label: "Name :", value: invoice.client?.name ?? "-" },
    ...(invoice.clientCIN ? ([{ label: "CIN :", value: invoice.clientCIN }] as KeyValueRow[]) : []),
    ...(invoice.client?.email ? ([{ label: "Email :", value: invoice.client.email }] as KeyValueRow[]) : []),
    ...(invoice.client?.phone ? ([{ label: "Phone :", value: invoice.client.phone }] as KeyValueRow[]) : []),
    ...(invoice.client?.location ? ([{ label: "Addr :", value: invoice.client.location }] as KeyValueRow[]) : []),
  ];

  const leftBox = drawSectionBox(doc, { x: leftBoxX, y: contentTop, w: halfWidth, title: "Invoice Details", rows: leftRows });
  const rightBox = drawSectionBox(doc, { x: rightBoxX, y: contentTop, w: halfWidth, title: "Bill To", rows: rightRows });
  const boxHeight = Math.max(leftBox.h, rightBox.h);

  // Items table
  const tableStartY = contentTop + boxHeight + 12;

  const unresolvedProductIds = (invoice.items ?? [])
    .filter((item) => !String(item.reference ?? "").trim())
    .map((item) => String(item.productId ?? item.id ?? "").trim())
    .filter(Boolean);
  const productReferenceMap = await loadProductReferenceMap(unresolvedProductIds);

  const rows = (invoice.items ?? []).map((item) => {
    const inlineReference = String(item.reference ?? "").trim();
    const productId = String(item.productId ?? item.id ?? "").trim();
    const resolvedReference = productId ? productReferenceMap[productId] : "";
    const reference = inlineReference || resolvedReference || (productId ? productId : "-");
    const qty = Number(item.quantity ?? 0);
    const unit = Number(item.unitPrice ?? 0);
    const total = Number(item.totalPrice ?? qty * unit);
    return [
      reference,
      String(item.description ?? "").trim() || "-",
      String(qty),
      formatMoneyDt(unit),
      formatMoneyDt(total),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [["Reference", "Description", "Qty", "Unit Price", "Total"]],
    body: rows,
    theme: "grid",
    styles: {
      font: "times",
      fontSize: 9.2,
      cellPadding: 3.5,
      lineColor: BORDER_GRAY,
      lineWidth: 0.2,
      textColor: 20,
      valign: "middle",
    },
    headStyles: {
      fillColor: BRAND_GRAY,
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
      font: "helvetica",
      fontSize: 9.5,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "left" },
      1: { cellWidth: 67, halign: "left" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  type AutoTableDoc = JsPdfDoc & { lastAutoTable?: { finalY?: number } };
  const afterTableY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? tableStartY;
  const totalsY = afterTableY + 10;

  // Totals area (right aligned, no border box)
  const boxWidth = 70;
  const boxX = pageWidth - marginX - boxWidth;

  // totals rows (no background shading)

  doc.setFontSize(9.6);
  doc.setFont("times", "normal");

  const subtotal = typeof invoice.subtotal === "number" ? invoice.subtotal : 0;
  const taxAmount = typeof invoice.taxAmount === "number" ? invoice.taxAmount : 0;
  const totalAmount = Number(invoice.totalAmount ?? 0);
  const labelX = boxX + 4;
  const valueX = boxX + boxWidth - 4;
  let rowY = totalsY + 6.6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Subtotal :", labelX, rowY);
  doc.setFont("times", "normal");
  doc.setTextColor(17, 24, 39);
  doc.text(formatMoneyDt(subtotal), valueX, rowY, { align: "right" });
  rowY += 6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Tax :", labelX, rowY);
  doc.setFont("times", "normal");
  doc.setTextColor(17, 24, 39);
  doc.text(formatMoneyDt(taxAmount), valueX, rowY, { align: "right" });
  rowY += 6;

  // emphasize total row
  doc.setDrawColor(BRAND_GRAY[0], BRAND_GRAY[1], BRAND_GRAY[2]);
  doc.setLineWidth(0.35);
  doc.line(boxX, rowY - 3.4, boxX + boxWidth, rowY - 3.4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(10.8);
  doc.text("Total :", labelX, rowY);
  doc.text(formatMoneyDt(totalAmount), valueX, rowY, { align: "right" });
  doc.setFont("times", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9.6);

  // Notes intentionally removed for a cleaner invoice

  // Footer (all pages)
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY - 6, pageWidth - marginX, footerY - 6);

    doc.setFontSize(8);
    doc.setFont("times", "normal");
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });
  }

  const safeFile = (invoiceNumber || "invoice").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  doc.save(`${safeFile}.pdf`);
}