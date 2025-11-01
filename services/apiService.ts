import { supabase, isSupabaseConfigured } from './supabaseClient';
import * as mockApi from './mockBackend';
import { 
    Customer, Product, Supplier, Quote, PurchaseOrder, AccountReceivable, AccountPayable, CashFlowSession, CashFlowEntry, 
    Task, CustomerNote, CompanyInfo, LaborRate, User, FrameConfiguration 
} from '../types';


// This file now acts as a facade. It will use the real Supabase service if configured,
// otherwise it will fall back to the mock service.

// --- Helper Functions (for Supabase) ---

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw error;
    }
}

const uploadImage = async (file: string, path: string): Promise<string> => {
    if (!file.startsWith('data:image')) {
        return file; // It's already a URL
    }
    
    const blob = await (await fetch(file)).blob();
    const fileName = `${path}/${new Date().getTime()}_${Math.random().toString(36).substring(7)}.${blob.type.split('/')[1]}`;

    const { data, error } = await supabase!.storage.from('images').upload(fileName, blob);
    handleSupabaseError(error, 'Image Upload');

    const { data: { publicUrl } } = supabase!.storage.from('images').getPublicUrl(data!.path);
    return publicUrl;
};

const createSupabaseCrud = <T extends { id: string }>(tableName: string) => ({
    getAll: async (): Promise<T[]> => {
        const { data, error } = await supabase!.from(tableName).select('*');
        handleSupabaseError(error, `getAll ${tableName}`);
        return (data as T[]) || [];
    },
    save: async (item: Omit<T, 'id'> & { id?: string }): Promise<T> => {
        const { id, ...itemData } = item;
        let result;
        if (id) {
            result = await supabase!.from(tableName).update(itemData).eq('id', id).select().single();
        } else {
            result = await supabase!.from(tableName).insert(itemData).select().single();
        }
        handleSupabaseError(result.error, `save ${tableName}`);
        return result.data as T;
    },
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase!.from(tableName).delete().eq('id', id);
        handleSupabaseError(error, `delete ${tableName}`);
    }
});


// --- Real Supabase API Implementation ---

const supabaseApi = {
    getCustomers: () => createSupabaseCrud<Customer>('customers').getAll(),
    saveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => createSupabaseCrud<Customer>('customers').save(customer),
    deleteCustomer: (id: string) => createSupabaseCrud<Customer>('customers').delete(id),

    getProducts: () => createSupabaseCrud<Product>('products').getAll(),
    deleteProduct: (id: string) => createSupabaseCrud<Product>('products').delete(id),
    saveProduct: async (product: Omit<Product, 'id'> & { id?: string }) => {
        if (product.imageUrl && product.imageUrl.startsWith('data:image')) {
            product.imageUrl = await uploadImage(product.imageUrl, 'products');
        }
        return createSupabaseCrud<Product>('products').save(product);
    },

    getSuppliers: () => createSupabaseCrud<Supplier>('suppliers').getAll(),
    saveSupplier: (supplier: Omit<Supplier, 'id'> & { id?: string }) => createSupabaseCrud<Supplier>('suppliers').save(supplier),
    deleteSupplier: (id: string) => createSupabaseCrud<Supplier>('suppliers').delete(id),
    
    getQuotes: () => createSupabaseCrud<Quote>('quotes').getAll(),
    deleteQuote: (id: string) => createSupabaseCrud<Quote>('quotes').delete(id),
    updateFrameStatus: async (quoteId: string, frameId: string, newStatus: FrameConfiguration['productionStatus']) => {
        const { data: quote, error } = await supabase!.from('quotes').select('frames').eq('id', quoteId).single();
        handleSupabaseError(error, 'updateFrameStatus fetch');
        if (!quote) throw new Error("Quote not found");

        const frames = quote.frames as FrameConfiguration[];
        const frameIndex = frames.findIndex((f: FrameConfiguration) => f.id === frameId);
        if(frameIndex === -1) throw new Error("Frame not found");

        frames[frameIndex].productionStatus = newStatus;
        if (newStatus === 'Entregue') {
            frames[frameIndex].deliveryDate = new Date().toISOString();
        }
        
        const { data: saved, error: saveError } = await supabase!.from('quotes').update({ frames: frames }).eq('id', quoteId).select().single();
        handleSupabaseError(saveError, 'updateFrameStatus save');
        return saved;
    },
    saveQuote: async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & { id?: string, total?: number }) => {
        for (const frame of quoteData.frames) {
            if (frame.imageUrl && frame.imageUrl.startsWith('data:image')) {
                frame.imageUrl = await uploadImage(frame.imageUrl, 'artwork');
            }
        }

        if (quoteData.id) {
            return createSupabaseCrud<Quote>('quotes').save(quoteData as Quote);
        }
        
        const { data, error } = await supabase!.rpc('get_next_quote_number');
        handleSupabaseError(error, 'get_next_quote_number');
        const newQuoteNumber = data;

        const newQuote: Omit<Quote, 'id'> = {
            ...quoteData,
            quoteNumber: newQuoteNumber,
            createdAt: new Date().toISOString(),
            total: quoteData.total || 0,
        };
        return createSupabaseCrud<Quote>('quotes').save(newQuote);
    },
    duplicateQuote: async (id: string) => {
        const { data: original, error } = await supabase!.from('quotes').select('*').eq('id', id).single();
        handleSupabaseError(error, 'duplicateQuote fetch');
        if (!original) throw new Error("Quote not found");
        const { id: oldId, quoteNumber, createdAt, status, ...rest } = original;
        const duplicatedQuoteData = { ...rest, status: 'Orçamento' };
        return supabaseApi.saveQuote(duplicatedQuoteData);
    },

    getPurchaseOrders: () => createSupabaseCrud<PurchaseOrder>('purchase_orders').getAll(),
    deletePurchaseOrder: (id: string) => createSupabaseCrud<PurchaseOrder>('purchase_orders').delete(id),
    savePurchaseOrder: async (orderData: Omit<PurchaseOrder, 'id'|'orderNumber'|'createdAt'> & {id?: string}) => {
         if (orderData.id) {
            return createSupabaseCrud<PurchaseOrder>('purchase_orders').save(orderData as PurchaseOrder);
        }
        const { data, error } = await supabase!.rpc('get_next_po_number');
        handleSupabaseError(error, 'get_next_po_number');
        const newPONumber = data;

        const newPO: Omit<PurchaseOrder, 'id'> = {
            ...orderData,
            orderNumber: newPONumber,
            createdAt: new Date().toISOString(),
        };
        return createSupabaseCrud<PurchaseOrder>('purchase_orders').save(newPO);
    },
    receivePurchaseOrder: async (id: string) => {
        const { data, error } = await supabase!.rpc('receive_purchase_order', { order_id: id });
        handleSupabaseError(error, 'receive_purchase_order RPC');
        return data;
    },

    getAccountsReceivable: () => createSupabaseCrud<AccountReceivable>('accounts_receivable').getAll(),
    saveAccountReceivable: (ar: Omit<AccountReceivable, 'id'>) => createSupabaseCrud<AccountReceivable>('accounts_receivable').save(ar),
    getAccountsPayable: () => createSupabaseCrud<AccountPayable>('accounts_payable').getAll(),
    getCashFlowSessions: () => createSupabaseCrud<CashFlowSession>('cash_flow_sessions').getAll(),
    getCashFlowEntries: () => createSupabaseCrud<CashFlowEntry>('cash_flow_entries').getAll(),

    getTasks: () => createSupabaseCrud<Task>('tasks').getAll(),
    deleteTask: (id: string) => createSupabaseCrud<Task>('tasks').delete(id),
    saveTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string; completedAt?: string }) => {
        if (task.id) {
            // The `as any` is a concession to the generic CRUD helper. 
            // The provided `task` object correctly represents the fields to be updated.
            return createSupabaseCrud<Task>('tasks').save(task as any);
        }
        const newTask = { ...task, createdAt: new Date().toISOString() };
        return createSupabaseCrud<Task>('tasks').save(newTask);
    },

    getCustomerNotes: () => createSupabaseCrud<CustomerNote>('customer_notes').getAll(),
    deleteCustomerNote: (id: string) => createSupabaseCrud<CustomerNote>('customer_notes').delete(id),
    saveCustomerNote: (note: Omit<CustomerNote, 'id' | 'createdAt'>) => {
        const newNote = { ...note, createdAt: new Date().toISOString() };
        return createSupabaseCrud<CustomerNote>('customer_notes').save(newNote);
    },
    
    updateStockForQuote: async (quoteId: string) => {
        const { data, error } = await supabase!.rpc('update_stock_for_quote', { quote_id: quoteId });
        handleSupabaseError(error, 'updateStockForQuote RPC');
        return data;
    },
    registerPayment: async (receivableId: string, amount: number, method: CashFlowEntry['method']) => {
        const { data, error } = await supabase!.rpc('register_payment', { p_receivable_id: receivableId, p_amount: amount, p_method: method });
        handleSupabaseError(error, 'registerPayment RPC');
        return data;
    },
    makePayment: async (payableId: string, amount: number, method: CashFlowEntry['method']) => {
         const { data, error } = await supabase!.rpc('make_payment', { p_payable_id: payableId, p_amount: amount, p_method: method });
        handleSupabaseError(error, 'makePayment RPC');
        return data;
    },
    openCashFlow: (openingBalance: number) => createSupabaseCrud<CashFlowSession>('cash_flow_sessions').save({ openingBalance, status: 'aberto', openedAt: new Date().toISOString() }),
    addCashFlowEntry: (entry: Omit<CashFlowEntry, 'id' | 'createdAt'>) => {
        const newEntry = { ...entry, createdAt: new Date().toISOString() };
        return createSupabaseCrud<CashFlowEntry>('cash_flow_entries').save(newEntry);
    },
    closeCashFlow: async (sessionId: string, closingBalance: number) => {
        const { data, error } = await supabase!.rpc('close_cash_flow_session', { p_session_id: sessionId, p_closing_balance: closingBalance });
        handleSupabaseError(error, 'closeCashFlow RPC');
        return data;
    },

    getCompanyInfo: async (): Promise<CompanyInfo> => {
        const { data, error } = await supabase!.from('settings').select('value').eq('key', 'companyInfo').single();
        handleSupabaseError(error, 'getCompanyInfo');
        return data ? data.value : { name: '', address: '', phone: '', email: '' };
    },
    saveCompanyInfo: async (info: CompanyInfo) => {
        if (info.logo && info.logo.startsWith('data:image')) {
            info.logo = await uploadImage(info.logo, 'company');
        }
        const { data, error } = await supabase!.from('settings').upsert({ key: 'companyInfo', value: info }).select().single();
        handleSupabaseError(error, 'saveCompanyInfo');
        return data.value;
    },
    getLaborRates: async (): Promise<LaborRate[]> => {
        const { data, error } = await supabase!.from('labor_rates').select('*');
        handleSupabaseError(error, 'getLaborRates');
        return data || [];
    },
    saveLaborRates: async (rates: LaborRate[]) => {
        const { data, error } = await supabase!.from('labor_rates').upsert(rates).select();
        handleSupabaseError(error, 'saveLaborRates');
        return data;
    },
    getTerms: async (): Promise<string> => {
         const { data, error } = await supabase!.from('settings').select('value').eq('key', 'termsAndConditions').single();
        handleSupabaseError(error, 'getTerms');
        return data ? data.value : '';
    },
    saveTerms: async (terms: string) => {
        await supabase!.from('settings').upsert({ key: 'termsAndConditions', value: terms });
        return terms;
    },

    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase!.from('profiles').select('*');
        handleSupabaseError(error, 'getUsers');
        return data || [];
    },
    saveUser: async (user: Omit<User, 'id' | 'password'> & { id: string }) => {
        const { id, ...profileData } = user;
        const { data, error } = await supabase!.from('profiles').update(profileData).eq('id', id).select().single();
        handleSupabaseError(error, 'saveUser (profile)');
        return data;
    },
    deleteUser: async (id: string) => {
        console.warn("Deleting user from UI only removes their profile, not their login. Please delete the user in the Supabase Auth dashboard.");
        const { error } = await supabase!.from('profiles').delete().eq('id', id);
        handleSupabaseError(error, 'deleteUser (profile)');
    },
};

// --- Conditionally export the correct API ---

const apiToExport = isSupabaseConfigured ? supabaseApi : mockApi;

// --- LOGIN E AUTENTICAÇÃO SIMPLES ---

export const loginUser = async (email: string, password: string): Promise<User | null> => {
    if (!isSupabaseConfigured || !supabase) {
        console.warn("⚠️ Supabase não configurado, login desativado.");
        return null;
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

    if (error) {
        console.error("Erro ao fazer login:", error.message);
        return null;
    }

    return data as User;
};

export const registerUser = async (email: string, password: string, role: string = 'user'): Promise<User | null> => {
    if (!isSupabaseConfigured || !supabase) {
        console.warn("⚠️ Supabase não configurado, registro desativado.");
        return null;
    }

    const { data, error } = await supabase
        .from('users')
        .insert([{ email, password, role }])
        .select()
        .single();

    if (error) {
        console.error("Erro ao registrar usuário:", error.message);
        return null;
    }

    return data as User;
};


export const {
    getCustomers,
    saveCustomer,
    deleteCustomer,
    getProducts,
    deleteProduct,
    saveProduct,
    getSuppliers,
    saveSupplier,
    deleteSupplier,
    getQuotes,
    deleteQuote,
    updateFrameStatus,
    saveQuote,
    duplicateQuote,
    getPurchaseOrders,
    deletePurchaseOrder,
    savePurchaseOrder,
    receivePurchaseOrder,
    getAccountsReceivable,
    saveAccountReceivable,
    getAccountsPayable,
    getCashFlowSessions,
    getCashFlowEntries,
    getTasks,
    deleteTask,
    saveTask,
    getCustomerNotes,
    deleteCustomerNote,
    saveCustomerNote,
    updateStockForQuote,
    registerPayment,
    makePayment,
    openCashFlow,
    addCashFlowEntry,
    closeCashFlow,
    getCompanyInfo,
    saveCompanyInfo,
    getLaborRates,
    saveLaborRates,
    getTerms,
    saveTerms,
    getUsers,
    saveUser,
    deleteUser,
} = apiToExport;
