import { 
    Customer, Product, Supplier, Quote, PurchaseOrder, AccountReceivable, AccountPayable, CashFlowSession, CashFlowEntry, 
    Task, CustomerNote, CompanyInfo, LaborRate, User, FrameConfiguration 
} from '../types';
import { 
    mockCustomers, mockProducts, mockSuppliers, mockQuotes, mockPurchaseOrders, mockAccountsReceivable, mockAccountsPayable,
    mockCashFlowSessions, mockCashFlowEntries, mockTasks, mockCustomerNotes, mockCompanyInfo, mockLaborRates, mockUsers,
    mockTermsAndConditions
} from './defaultData';

// In-memory data store
let customers = [...mockCustomers];
let products = [...mockProducts];
let suppliers = [...mockSuppliers];
let quotes = [...mockQuotes];
let purchaseOrders = [...mockPurchaseOrders];
let accountsReceivable = [...mockAccountsReceivable];
let accountsPayable = [...mockAccountsPayable];
let cashFlowSessions = [...mockCashFlowSessions];
let cashFlowEntries = [...mockCashFlowEntries];
let tasks = [...mockTasks];
let customerNotes = [...mockCustomerNotes];
let companyInfo = {...mockCompanyInfo};
let laborRates = [...mockLaborRates];
let termsAndConditions = mockTermsAndConditions;
let users = [...mockUsers];

// Counters for new items
let quoteCounter = quotes.length + 1;
let poCounter = purchaseOrders.length + 1;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const createMockCrud = <T extends { id: string }>(store: T[]) => ({
    getAll: async (): Promise<T[]> => {
        await delay(50);
        return store;
    },
    save: async (item: Omit<T, 'id'> & { id?: string }): Promise<T> => {
        await delay(50);
        if (item.id && store.some(s => s.id === item.id)) {
            const index = store.findIndex(s => s.id === item.id);
            store[index] = { ...store[index], ...item };
            return store[index] as T;
        } else {
            const newItem = { ...item, id: `mock-${Date.now()}` } as T;
            store.push(newItem);
            return newItem;
        }
    },
    delete: async (id: string): Promise<void> => {
        await delay(50);
        const index = store.findIndex(s => s.id === id);
        if (index > -1) {
            store.splice(index, 1);
        }
    }
});

// --- Export mock functions matching apiService.ts ---

export const getCustomers = async () => customers;
export const saveCustomer = createMockCrud(customers).save;
export const deleteCustomer = createMockCrud(customers).delete;

export const getProducts = async () => products;
export const saveProduct = createMockCrud(products).save;
export const deleteProduct = createMockCrud(products).delete;

export const getSuppliers = async () => suppliers;
export const saveSupplier = createMockCrud(suppliers).save;
export const deleteSupplier = createMockCrud(suppliers).delete;

export const getQuotes = async () => quotes;
export const deleteQuote = createMockCrud(quotes).delete;

export const saveQuote = async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & { id?: string, total?: number }) => {
    if (quoteData.id) {
        const index = quotes.findIndex(q => q.id === quoteData.id);
        if (index > -1) {
            quotes[index] = { ...quotes[index], ...quoteData, total: quoteData.total || quotes[index].total };
            return quotes[index];
        }
    }
    const newQuote: Quote = {
        ...quoteData,
        id: `mock-q-${Date.now()}`,
        quoteNumber: `M${String(202400 + quoteCounter++).padStart(4, '0')}`,
        createdAt: new Date().toISOString(),
        total: quoteData.total || 0,
    };
    quotes.unshift(newQuote);
    return newQuote;
};

export const duplicateQuote = async (id: string) => {
    const original = quotes.find(q => q.id === id);
    if (!original) throw new Error("Quote not found");
    const { id: oldId, quoteNumber, createdAt, status, ...rest } = original;
    const duplicatedQuoteData = { ...rest, status: 'Orçamento' as const };
    return saveQuote(duplicatedQuoteData);
};

export const updateFrameStatus = async (quoteId: string, frameId: string, newStatus: FrameConfiguration['productionStatus']) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error("Quote not found");
    const frame = quote.frames.find(f => f.id === frameId);
    if (!frame) throw new Error("Frame not found");
    frame.productionStatus = newStatus;
    if (newStatus === 'Entregue') frame.deliveryDate = new Date().toISOString();
    return { ...quote };
};

export const getPurchaseOrders = async () => purchaseOrders;
export const deletePurchaseOrder = createMockCrud(purchaseOrders).delete;

export const savePurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id'|'orderNumber'|'createdAt'> & {id?: string}) => {
    if (orderData.id) {
        return createMockCrud(purchaseOrders).save(orderData as PurchaseOrder);
    }
    const newPO: PurchaseOrder = {
        ...orderData,
        id: `mock-po-${Date.now()}`,
        orderNumber: `PO${String(1000 + poCounter++).padStart(4, '0')}`,
        createdAt: new Date().toISOString(),
    };
    purchaseOrders.unshift(newPO);
    return newPO;
};

export const receivePurchaseOrder = async (id: string) => {
    const order = purchaseOrders.find(po => po.id === id);
    if (!order) throw new Error("PO not found");
    order.status = 'Recebido';
    order.receivedAt = new Date().toISOString();

    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) product.stockQuantity += item.quantity;
    });

    const newAP: AccountPayable = {
        id: `mock-ap-${Date.now()}`,
        purchaseOrderId: order.id,
        purchaseOrderNumber: order.orderNumber,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        totalAmount: order.totalCost,
        paidAmount: 0,
        dueDate: order.dueDate,
        status: 'Pendente'
    };
    accountsPayable.push(newAP);

    return { updatedOrder: order, updatedProducts: products, newAccountPayable: newAP };
};

export const getAccountsReceivable = async () => accountsReceivable;
export const saveAccountReceivable = createMockCrud(accountsReceivable).save;
export const getAccountsPayable = async () => accountsPayable;
export const getCashFlowSessions = async () => cashFlowSessions;
export const getCashFlowEntries = async () => cashFlowEntries;
export const getTasks = async () => tasks;
export const deleteTask = createMockCrud(tasks).delete;
export const saveTask = async (task: Omit<Task, 'id' | 'createdAt'> & { id?: string; completedAt?: string }): Promise<Task> => {
    await delay(50);
    if (task.id) {
        const index = tasks.findIndex(s => s.id === task.id);
        if (index > -1) {
            tasks[index] = { ...tasks[index], ...task };
            return tasks[index];
        }
        throw new Error(`Task with id ${task.id} not found`);
    } else {
        const newItem = { ...task, id: `mock-task-${Date.now()}`, createdAt: new Date().toISOString() } as Task;
        tasks.push(newItem);
        return newItem;
    }
};
export const getCustomerNotes = async () => customerNotes;
export const deleteCustomerNote = createMockCrud(customerNotes).delete;
export const saveCustomerNote = async (note: Omit<CustomerNote, 'id' | 'createdAt'>): Promise<CustomerNote> => {
    await delay(50);
    const newNote: CustomerNote = {
        ...note,
        id: `mock-note-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    customerNotes.push(newNote);
    return newNote;
};

export const updateStockForQuote = async (quoteId: string) => {
    // This is a complex logic, for mock we just simulate it ran successfully
    console.log(`(Mock) Stock updated for quote ${quoteId}`);
    return products;
};

export const registerPayment = async (receivableId: string, amount: number, method: CashFlowEntry['method']) => {
    const receivable = accountsReceivable.find(ar => ar.id === receivableId);
    if (!receivable) throw new Error("Receivable not found");
    receivable.paidAmount += amount;
    if (receivable.paidAmount >= receivable.totalAmount) {
        receivable.status = 'Pago';
    } else {
        receivable.status = 'Pago Parcialmente';
    }
    const openSession = cashFlowSessions.find(s => s.status === 'aberto');
    let newEntry: CashFlowEntry | null = null;
    if (openSession) {
        newEntry = {
            id: `mock-cfe-${Date.now()}`,
            sessionId: openSession.id,
            createdAt: new Date().toISOString(),
            type: 'entrada',
            description: `Recebimento Pedido #${receivable.quoteNumber}`,
            amount,
            method,
        };
        cashFlowEntries.push(newEntry);
    }
    return { updatedReceivable: receivable, newEntry };
};

export const makePayment = async (payableId: string, amount: number, method: CashFlowEntry['method']) => {
    const payable = accountsPayable.find(ap => ap.id === payableId);
    if (!payable) throw new Error("Payable not found");
    payable.paidAmount += amount;
     if (payable.paidAmount >= payable.totalAmount) {
        payable.status = 'Pago';
    } else {
        payable.status = 'Pago Parcialmente';
    }
     const openSession = cashFlowSessions.find(s => s.status === 'aberto');
    let newEntry: CashFlowEntry | null = null;
    if (openSession) {
        newEntry = {
            id: `mock-cfe-${Date.now()}`,
            sessionId: openSession.id,
            createdAt: new Date().toISOString(),
            type: 'saida',
            description: `Pagamento Compra #${payable.purchaseOrderNumber}`,
            amount,
            method,
        };
        cashFlowEntries.push(newEntry);
    }
    return { updatedPayable: payable, newEntry };
};

export const openCashFlow = async (openingBalance: number) => {
    const newSession: CashFlowSession = {
        id: `mock-cfs-${Date.now()}`,
        openedAt: new Date().toISOString(),
        openingBalance,
        status: 'aberto'
    };
    cashFlowSessions.push(newSession);
    return newSession;
};

export const addCashFlowEntry = async (entry: Omit<CashFlowEntry, 'id'|'createdAt'>) => {
    const newEntry: CashFlowEntry = {
        ...entry,
        id: `mock-cfe-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    cashFlowEntries.push(newEntry);
    return newEntry;
};

export const closeCashFlow = async (sessionId: string, closingBalance: number) => {
    const session = cashFlowSessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const entries = cashFlowEntries.filter(e => e.sessionId === sessionId);
    const totalIn = entries.filter(e=>e.type === 'entrada').reduce((sum, e) => sum + e.amount, 0);
    const totalOut = entries.filter(e=>e.type === 'saida').reduce((sum, e) => sum + e.amount, 0);
    const expected = session.openingBalance + totalIn - totalOut;

    session.status = 'fechado';
    session.closedAt = new Date().toISOString();
    session.closingBalance = closingBalance;
    session.expectedBalance = expected;
    session.difference = closingBalance - expected;
    return session;
};

export const getCompanyInfo = async () => companyInfo;
export const saveCompanyInfo = async (info: CompanyInfo) => {
    companyInfo = info;
    return companyInfo;
};
export const getLaborRates = async () => laborRates;
export const saveLaborRates = async (rates: LaborRate[]) => {
    laborRates = rates.map(r => ({...r, id: r.id.startsWith('new-') ? `mock-lr-${Date.now()}` : r.id }));
    return laborRates;
};
export const getTerms = async () => termsAndConditions;
export const saveTerms = async (terms: string) => {
    termsAndConditions = terms;
    return terms;
};

export const getUsers = async () => users;
export const saveUser = async (user: Omit<User, 'id' | 'password'> & { id: string }) => {
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...user };
        return users[userIndex];
    }
    throw new Error("User not found");
};
export const deleteUser = async (id: string) => {
    console.warn("Mock delete: user removed from local list.");
    users = users.filter(u => u.id !== id);
};