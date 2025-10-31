
export interface User {
    id: string;
    username: string;
    password?: string;
    role: 'admin' | 'employee';
}

export interface Customer {
    id: string;
    name: string;
    documentNumber?: string;
    email: string;
    phone: string;
    address: string;
}

export type ProductType = 'moldura' | 'vidro' | 'fundo' | 'passe-partout' | 'substrato' | 'servico' | 'chassis' | 'impressao';

export interface Product {
    id: string;
    name: string;
    code: string;
    productType: ProductType;
    supplierId: string | null;
    cost: number;
    price: number;
    width?: number; // cm, for frames
    length?: number; // m, for frames
    sheetWidth?: number; // cm, for sheet goods
    sheetHeight?: number; // cm, for sheet goods
    stockQuantity: number;
    unit: 'm' | 'm²' | 'un';
    imageUrl?: string;
    color?: string; // for passe-partout
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
}

export interface FrameConfiguration {
    id: string;
    name: string;
    width: number;
    height: number;
    quantity: number;
    imageUrl?: string;
    frame1Id?: string;
    frame2Id?: string;
    glassId?: string;
    backingId?: string;
    passepartoutId?: string;
    chassisId?: string;
    printingId?: string;
    substratoId?: string;
    servicoId?: string;
    passepartoutWidth: number;
    glassMargin: number;
    printingMargin: number;
    extraProduct: { name: string; price: number };
    observations: string;
    totalPrice: number;
    totalCost: number;
    includeFrame1WasteCost?: boolean;
    includeFrame2WasteCost?: boolean;
    productionStatus?: 'Em produção' | 'Pronto' | 'Entregue';
    deliveryDate?: string;
}

export interface PaymentDetails {
    method: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência' | 'Outro';
    discountType: 'fixed' | 'percentage';
    discountValue: number;
    shippingCost: number;
    paymentCondition: 'À Vista' | 'Sinal + Restante' | 'Parcelado';
    downPayment: number;
    isDownPaymentPaid: boolean;
    finalTotal: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    frames: FrameConfiguration[];
    total: number;
    createdAt: string;
    status: 'Orçamento' | 'Aprovado' | 'Recusado' | 'Vendido';
    surcharge?: number;
    surchargeType?: 'fixed' | 'percentage';
    payment?: PaymentDetails;
    deliveryDate?: string;
}

export interface CompanyInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logo?: string;
}

export interface LaborRate {
    id: string;
    minPerimeter: number;
    price: number;
}

export interface AccountReceivable {
    id: string;
    quoteId: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago Parcialmente' | 'Pago';
}

export interface AccountPayable {
    id: string;
    purchaseOrderId: string;
    purchaseOrderNumber: string;
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago Parcialmente' | 'Pago';
}

export interface CashFlowSession {
    id: string;
    openedAt: string;
    closedAt?: string;
    openingBalance: number;
    closingBalance?: number;
    expectedBalance?: number;
    difference?: number;
    status: 'aberto' | 'fechado';
}

export interface CashFlowEntry {
    id: string;
    sessionId: string;
    createdAt: string;
    type: 'entrada' | 'saida';
    description: string;
    amount: number;
    method: 'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Outro';
}

export interface PurchaseOrderItem {
    id: string;
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    cost: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseOrderItem[];
    totalCost: number;
    status: 'Pendente' | 'Recebido' | 'Cancelado';
    createdAt: string;
    receivedAt?: string;
    dueDate: string;
}

export interface Task {
    id: string;
    content: string;
    dueDate: string;
    isCompleted: boolean;
    createdAt: string;
    completedAt?: string;
}

export interface CustomerNote {
    id: string;
    customerId: string;
    content: string;
    createdAt: string;
}

// Types for Cutting Optimizer
export interface CutPiece {
    id: string;
    width: number;
    height: number;
    label: string;
}
export interface PlacedPiece {
    piece: CutPiece;
    x: number;
    y: number;
    rotated: boolean;
}
export interface Layout {
    stockUnitIndex: number;
    placedPieces: PlacedPiece[];
    waste: number;
}
export interface CuttingPlanResult {
    stockUnitsUsed: number;
    totalPiecesArea: number;
    totalStockArea: number;
    totalWaste: number;
    wastePercentage: number;
    layouts: Layout[];
}
export interface StockMaterial {
    productId: string;
    productCode: string;
    productName: string;
    type: 'bar' | 'sheet';
    width: number;
    height: number;
}