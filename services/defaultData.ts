import { 
    Customer, Product, Supplier, Quote, PurchaseOrder, AccountReceivable, AccountPayable, CashFlowSession, CashFlowEntry, 
    Task, CustomerNote, CompanyInfo, LaborRate, User, FrameConfiguration 
} from '../types';

export const mockCompanyInfo: CompanyInfo = {
    name: 'MolduraSoft Pro',
    address: 'Rua das Molduras, 123\nCentro, Cidade Criativa\nCEP 12345-678',
    phone: '(11) 98765-4321',
    email: 'contato@moldurasoft.com',
    website: 'www.moldurasoft.com',
    logo: 'https://placehold.co/200x80/6366f1/white?text=MolduraSoft'
};

export const mockUsers: User[] = [
    { id: 'user-1-admin', username: 'admin@moldurasoft.com', role: 'admin' },
    { id: 'user-2-employee', username: 'funcionario@moldurasoft.com', role: 'employee' }
];

export const mockLaborRates: LaborRate[] = [
    { id: 'lr-1', minPerimeter: 0, price: 30 },
    { id: 'lr-2', minPerimeter: 200, price: 50 },
    { id: 'lr-3', minPerimeter: 400, price: 80 }
];

export const mockTermsAndConditions: string = `1. Validade da Proposta: 15 dias.
2. Prazo de Entrega: A combinar, a partir da aprovação do orçamento e pagamento do sinal.
3. Pagamento: 50% de sinal no pedido, restante na entrega.
4. Variações de Cor: As cores das molduras podem sofrer pequenas variações de tonalidade.`;

export const mockSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'Molduras & Cia', contactPerson: 'Carlos Silva', email: 'carlos@moldurascia.com', phone: '1111-2222'},
    { id: 'sup-2', name: 'Vidros Limpido', contactPerson: 'Ana Pereira', email: 'ana@vidros.com', phone: '3333-4444'},
];

export const mockProducts: Product[] = [
    { id: 'p-1', name: 'Moldura Lisa Preta 2cm', code: 'MOL-001', productType: 'moldura', supplierId: 'sup-1', cost: 15, price: 45, width: 2, length: 3, stockQuantity: 50, unit: 'm', imageUrl: 'https://placehold.co/400x400/000000/FFF?text=MOL-001' },
    { id: 'p-2', name: 'Moldura Caixa Branca 3cm', code: 'MOL-002', productType: 'moldura', supplierId: 'sup-1', cost: 25, price: 75, width: 3, length: 3, stockQuantity: 30, unit: 'm', imageUrl: 'https://placehold.co/400x400/FFFFFF/000?text=MOL-002' },
    { id: 'p-3', name: 'Vidro Comum 2mm', code: 'VID-001', productType: 'vidro', supplierId: 'sup-2', cost: 40, price: 100, sheetWidth: 120, sheetHeight: 180, stockQuantity: 10, unit: 'm²', imageUrl: 'https://placehold.co/400x400/E0E7FF/3730a3?text=Vidro' },
    { id: 'p-4', name: 'Fundo Eucatex 3mm', code: 'FUN-001', productType: 'fundo', supplierId: 'sup-1', cost: 20, price: 50, sheetWidth: 122, sheetHeight: 275, stockQuantity: 15, unit: 'm²', imageUrl: 'https://placehold.co/400x400/8d6e63/FFF?text=Fundo' },
    { id: 'p-5', name: 'Paspatur Branco Neve', code: 'PAS-001', productType: 'passe-partout', supplierId: 'sup-1', cost: 30, price: 80, sheetWidth: 80, sheetHeight: 120, stockQuantity: 20, unit: 'm²', imageUrl: 'https://placehold.co/400x400/f8fafc/334155?text=Paspatur', color: '#f8fafc' },
    { id: 'p-6', name: 'Impressão Fotográfica', code: 'SRV-001', productType: 'servico', supplierId: null, cost: 50, price: 120, stockQuantity: 1000, unit: 'un', imageUrl: 'https://placehold.co/400x400/be185d/FFF?text=Impress%C3%A3o' },
];

export const mockCustomers: Customer[] = [
    { id: 'cus-1', name: 'Ana Costa', documentNumber: '111.222.333-44', email: 'ana@email.com', phone: '9999-8888', address: 'Rua das Flores, 10' },
    { id: 'cus-2', name: 'Bruno Dias', documentNumber: '222.333.444-55', email: 'bruno@email.com', phone: '7777-6666', address: 'Avenida Principal, 20' }
];

const mockFrame1: FrameConfiguration = {
    id: 'frame-1',
    name: 'Quadro Abstrato',
    width: 40,
    height: 60,
    quantity: 1,
    frame1Id: 'p-1',
    glassId: 'p-3',
    backingId: 'p-4',
    passepartoutId: 'p-5',
    passepartoutWidth: 5,
    glassMargin: 0, printingMargin: 0,
    extraProduct: { name: '', price: 0 },
    observations: 'Cliente pediu urgência.',
    totalPrice: 251.44,
    totalCost: 87.81,
    productionStatus: 'Em produção',
    deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockQuotes: Quote[] = [
    {
        id: 'quote-1',
        quoteNumber: 'M2024001',
        customerId: 'cus-1',
        customerName: 'Ana Costa',
        frames: [mockFrame1],
        total: 251.44,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Vendido',
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        payment: {
            method: 'PIX',
            discountType: 'fixed',
            discountValue: 0,
            shippingCost: 0,
            paymentCondition: 'À Vista',
            downPayment: 0,
            isDownPaymentPaid: false,
            finalTotal: 251.44
        }
    },
    {
        id: 'quote-2',
        quoteNumber: 'M2024002',
        customerId: 'cus-2',
        customerName: 'Bruno Dias',
        frames: [{...mockFrame1, id: 'frame-2', frame1Id: 'p-2', quantity: 2, totalPrice: 350, totalCost: 150}],
        total: 700,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Orçamento'
    }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
    { id: 'po-1', orderNumber: 'PO1001', supplierId: 'sup-1', supplierName: 'Molduras & Cia', items: [], totalCost: 500, status: 'Pendente', createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() }
];

export const mockAccountsReceivable: AccountReceivable[] = [
    { id: 'ar-1', quoteId: 'quote-1', quoteNumber: 'M2024001', customerId: 'cus-1', customerName: 'Ana Costa', totalAmount: 251.44, paidAmount: 0, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pendente' }
];

export const mockAccountsPayable: AccountPayable[] = [];

export const mockCashFlowSessions: CashFlowSession[] = [
    { id: 'cfs-1', openedAt: new Date().toISOString(), openingBalance: 150.00, status: 'aberto' }
];

export const mockCashFlowEntries: CashFlowEntry[] = [
    { id: 'cfe-1', sessionId: 'cfs-1', createdAt: new Date().toISOString(), type: 'entrada', description: 'Venda #M2023123', amount: 300.00, method: 'PIX'}
];

export const mockTasks: Task[] = [
    { id: 'task-1', content: 'Ligar para fornecedor de vidro', dueDate: new Date().toISOString().split('T')[0], isCompleted: false, createdAt: new Date().toISOString() }
];

export const mockCustomerNotes: CustomerNote[] = [
    { id: 'note-1', customerId: 'cus-1', content: 'Prefere molduras minimalistas.', createdAt: new Date().toISOString() }
];