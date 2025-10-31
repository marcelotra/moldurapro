import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import QuotesPage from './components/QuotesPage';
import CustomersPage from './components/CustomersPage';
import ProductsPage from './components/ProductsPage';
import SuppliersPage from './components/SuppliersPage';
import PurchasesPage from './components/PurchasesPage';
import ProductionPage from './components/ProductionPage';
import FinancialPage from './components/FinancialPage';
import CashFlowPage from './components/CashFlowPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import AccountPage from './components/AccountPage';
import VirtualStudioPage from './components/VirtualStudioPage';
import CuttingPlanPage from './components/CuttingPlanPage';
import CheckoutPage from './components/CheckoutPage';
import * as apiService from './services/apiService';
import { isSupabaseConfigured } from './services/supabaseClient';

import { 
    Customer, Product, Supplier, Quote, PurchaseOrder, AccountReceivable, AccountPayable, CashFlowSession, CashFlowEntry, 
    Task, CustomerNote, CompanyInfo, LaborRate, User, PaymentDetails, FrameConfiguration
} from './types';
import { useAuth } from './auth/AuthContext';

export type Page = 'dashboard' | 'quotes' | 'customers' | 'products' | 'suppliers' | 'purchases' | 'production' | 'financial' | 'cashflow' | 'reports' | 'settings' | 'account' | 'studio' | 'cutting' | 'checkout';

const App: React.FC = () => {
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [showDemoBanner, setShowDemoBanner] = useState(!isSupabaseConfigured);

    // Main application state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
    const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
    const [cashFlowSessions, setCashFlowSessions] = useState<CashFlowSession[]>([]);
    const [cashFlowEntries, setCashFlowEntries] = useState<CashFlowEntry[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
    
    // Settings state
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: 'MolduraSoft', address: '', phone: '', email: '' });
    const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
    const [termsAndConditions, setTermsAndConditions] = useState('');
    const [users, setUsers] = useState<User[]>([]);

    // State for checkout flow
    const [quoteForCheckout, setQuoteForCheckout] = useState<(Omit<Quote, 'id'> & {id?: string}) | null>(null);

    const loadAllData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [
                customersData, productsData, suppliersData, quotesData, purchaseOrdersData, 
                arData, apData, sessionsData, entriesData, tasksData, notesData, 
                companyInfoData, laborRatesData, termsData, usersData
            ] = await Promise.all([
                apiService.getCustomers(), apiService.getProducts(), apiService.getSuppliers(),
                apiService.getQuotes(), apiService.getPurchaseOrders(), apiService.getAccountsReceivable(),
                apiService.getAccountsPayable(), apiService.getCashFlowSessions(), apiService.getCashFlowEntries(),
                apiService.getTasks(), apiService.getCustomerNotes(), apiService.getCompanyInfo(),
                apiService.getLaborRates(), apiService.getTerms(), 
                user.role === 'admin' ? apiService.getUsers() : Promise.resolve([]),
            ]);
            setCustomers(customersData);
            setProducts(productsData);
            setSuppliers(suppliersData);
            setQuotes(quotesData);
            setPurchaseOrders(purchaseOrdersData);
            setAccountsReceivable(arData);
            setAccountsPayable(apData);
            setCashFlowSessions(sessionsData);
            setCashFlowEntries(entriesData);
            setTasks(tasksData);
            setCustomerNotes(notesData);
            if(companyInfoData) setCompanyInfo(companyInfoData);
            setLaborRates(laborRatesData);
            setTermsAndConditions(termsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load data:", error);
            // Handle error appropriately, e.g., show a notification
        } finally {
            setIsLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // --- CRUD Handlers ---
    const handleSaveCustomer = async (customer: Omit<Customer, 'id'> & { id?: string }) => {
        const saved = await apiService.saveCustomer(customer);
        if (saved) {
            if (customer.id) {
                setCustomers(customers.map(c => c.id === saved.id ? saved : c));
            } else {
                setCustomers([...customers, saved]);
            }
        }
    };
    const handleDeleteCustomer = async (id: string) => {
        await apiService.deleteCustomer(id);
        setCustomers(customers.filter(c => c.id !== id));
        setCustomerNotes(customerNotes.filter(n => n.customerId !== id));
    };
    
    const handleSaveProduct = async (product: Omit<Product, 'id'> & { id?: string }) => {
        const saved = await apiService.saveProduct(product);
        if (saved) {
            if (product.id) {
                setProducts(products.map(p => p.id === saved.id ? saved : p));
            } else {
                setProducts([...products, saved]);
            }
        }
    };
    const handleDeleteProduct = async (id: string) => {
        await apiService.deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
    };
    
    const handleSaveSupplier = async (supplier: Omit<Supplier, 'id'> & { id?: string }) => {
        const saved = await apiService.saveSupplier(supplier);
        if (saved) {
            if (supplier.id) {
                setSuppliers(suppliers.map(s => s.id === saved.id ? saved : s));
            } else {
                setSuppliers([...suppliers, saved]);
            }
        }
    };
    const handleDeleteSupplier = async (id: string) => {
        await apiService.deleteSupplier(id);
        setSuppliers(suppliers.filter(s => s.id !== id));
    };

    const handleSaveQuote = async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => {
        const subtotal = quoteData.frames.reduce((sum, f) => sum + (f.totalPrice * f.quantity), 0);
        const quoteToSave = { ...quoteData, total: subtotal };
        const saved = await apiService.saveQuote(quoteToSave);
        if (saved) {
            if(quoteData.id) {
                setQuotes(quotes.map(q => q.id === saved.id ? saved : q));
            } else {
                setQuotes([saved, ...quotes]);
            }
        }
    };

    const handleFinalizeSale = async (quoteData: Omit<Quote, 'id'> & { id?: string }, paymentDetails: PaymentDetails) => {
        const quoteToSave: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'> & {id?: string} = {
            ...quoteData,
            status: 'Vendido',
            total: paymentDetails.finalTotal,
            payment: paymentDetails
        };
        const savedQuote = await apiService.saveQuote(quoteToSave);
        
        if (savedQuote) {
             if(quoteData.id) {
                setQuotes(quotes.map(q => q.id === savedQuote.id ? savedQuote : q));
            } else {
                setQuotes([savedQuote, ...quotes]);
            }
            
            // 2. Create Account Receivable
            const newAR: Omit<AccountReceivable, 'id'> = {
                quoteId: savedQuote.id,
                quoteNumber: savedQuote.quoteNumber,
                customerId: savedQuote.customerId,
                customerName: savedQuote.customerName,
                totalAmount: savedQuote.total,
                paidAmount: 0,
                dueDate: savedQuote.deliveryDate || new Date().toISOString().split('T')[0],
                status: 'Pendente',
            };
            const savedAR = await apiService.saveAccountReceivable(newAR);
            if (savedAR) setAccountsReceivable(prev => [...prev, savedAR]);
            
            // 3. Update stock
            const updatedProducts = await apiService.updateStockForQuote(savedQuote.id);
            if(updatedProducts) setProducts(updatedProducts);

            setCurrentPage('quotes');
            setQuoteForCheckout(null);
        }
    };

    const handleDeleteQuote = async (id: string) => {
        await apiService.deleteQuote(id);
        setQuotes(quotes.filter(q => q.id !== id));
    };
    
    const handleDuplicateQuote = async (id: string) => {
        const saved = await apiService.duplicateQuote(id);
        if (saved) setQuotes(prev => [saved, ...prev]);
    };
    
    const handleSavePurchaseOrder = async (order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'> & { id?: string }) => {
        const saved = await apiService.savePurchaseOrder(order);
        if (saved) {
            if(order.id) {
                setPurchaseOrders(purchaseOrders.map(po => po.id === saved.id ? saved : po));
            } else {
                setPurchaseOrders([saved, ...purchaseOrders]);
            }
        }
    };
    const handleDeletePurchaseOrder = async (id: string) => {
        await apiService.deletePurchaseOrder(id);
        setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
    };
    const handleReceivePurchaseOrder = async (id: string) => {
        const result = await apiService.receivePurchaseOrder(id);
        if (result) {
            const { updatedOrder, updatedProducts, newAccountPayable } = result;
            setPurchaseOrders(purchaseOrders.map(po => po.id === id ? updatedOrder : po));
            setProducts(updatedProducts);
            setAccountsPayable(prev => [...prev, newAccountPayable]);
        }
    };
    
    const handleUpdateFrameStatus = async (quoteId: string, frameId: string, newStatus: FrameConfiguration['productionStatus']) => {
        const saved = await apiService.updateFrameStatus(quoteId, frameId, newStatus);
        if (saved) setQuotes(quotes.map(q => q.id === saved.id ? saved : q));
    };
    
    const handleRegisterPayment = async (receivableId: string, amount: number, method: CashFlowEntry['method']) => {
        const result = await apiService.registerPayment(receivableId, amount, method);
        if(result){
            const { updatedReceivable, newEntry } = result;
            setAccountsReceivable(accountsReceivable.map(ar => ar.id === updatedReceivable.id ? updatedReceivable : ar));
            if (newEntry) setCashFlowEntries(prev => [...prev, newEntry]);
        }
    };
    
    const handleMakePayment = async (payableId: string, amount: number, method: CashFlowEntry['method']) => {
        const result = await apiService.makePayment(payableId, amount, method);
        if (result) {
            const { updatedPayable, newEntry } = result;
            setAccountsPayable(accountsPayable.map(ap => ap.id === updatedPayable.id ? updatedPayable : ap));
            if(newEntry) setCashFlowEntries(prev => [...prev, newEntry]);
        }
    };

    const handleOpenCashFlow = async (openingBalance: number) => {
        const newSession = await apiService.openCashFlow(openingBalance);
        if (newSession) setCashFlowSessions(prev => [...prev, newSession]);
    };
    const handleAddCashFlowEntry = async (entry: Omit<CashFlowEntry, 'id' | 'createdAt'>) => {
        const newEntry = await apiService.addCashFlowEntry(entry);
        if (newEntry) setCashFlowEntries(prev => [...prev, newEntry]);
    };
    const handleCloseCashFlow = async (sessionId: string, closingBalance: number) => {
        const closedSession = await apiService.closeCashFlow(sessionId, closingBalance);
        if(closedSession) setCashFlowSessions(sessions => sessions.map(s => s.id === sessionId ? closedSession : s));
    };

    const handleSaveTask = async (task: Omit<Task, 'id' | 'createdAt'> & { id?: string; completedAt?: string }) => {
        const taskToSave = { ...task };

        if (task.id && 'isCompleted' in task) {
            const originalTask = tasks.find(t => t.id === task.id);
            if (originalTask) {
                if (task.isCompleted && !originalTask.isCompleted) {
                    // Task is being completed now
                    taskToSave.completedAt = new Date().toISOString();
                } else if (!task.isCompleted && originalTask.isCompleted) {
                    // Task is being un-completed
                    taskToSave.completedAt = undefined;
                }
            }
        }

        const saved = await apiService.saveTask(taskToSave);
        if (saved) {
            if (task.id) {
                setTasks(tasks.map(t => t.id === saved.id ? saved : t));
            } else {
                setTasks([...tasks, saved]);
            }
        }
    };
    const handleDeleteTask = async (id: string) => {
        await apiService.deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
    };
    
    const handleSaveNote = async (note: Omit<CustomerNote, 'id' | 'createdAt'>) => {
        const saved = await apiService.saveCustomerNote(note);
        if (saved) setCustomerNotes(prev => [...prev, saved]);
    };
    const handleDeleteNote = async (id: string) => {
        await apiService.deleteCustomerNote(id);
        setCustomerNotes(prev => prev.filter(n => n.id !== id));
    };
    
    const handleSaveCompanyInfo = async (info: CompanyInfo) => {
        const saved = await apiService.saveCompanyInfo(info);
        if (saved) setCompanyInfo(saved);
    };
    const handleSaveLaborRates = async (rates: LaborRate[]) => {
        const saved = await apiService.saveLaborRates(rates);
        setLaborRates(saved);
    };
    const handleSaveTerms = async (terms: string) => {
        await apiService.saveTerms(terms);
        setTermsAndConditions(terms);
    };
    
    const handleSaveUser = async (user: Omit<User, 'id'> & { id?: string; password?: string }) => {
        if (!user.id) {
            console.error("Cannot save user without an ID. Creation from UI is not supported.");
            return;
        }

        const { password, ...userToSave } = user;
        const saved = await apiService.saveUser({ ...userToSave, id: user.id });
        if (saved) {
            const usersData = await apiService.getUsers();
            setUsers(usersData);
        }
    };

    const handleDeleteUser = async (id: string) => {
        await apiService.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
    };
    
    const handleProceedToCheckout = (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => {
        const subtotal = quoteData.frames.reduce((sum, f) => sum + (f.totalPrice * f.quantity), 0);
        
        const originalQuote = quoteData.id ? quotes.find(q => q.id === quoteData.id) : null;

        const fullQuoteForCheckout: Omit<Quote, 'id'> & {id?: string} = {
            ...quoteData,
            quoteNumber: originalQuote?.quoteNumber || '',
            createdAt: originalQuote?.createdAt || new Date().toISOString(),
            total: subtotal,
            status: quoteData.status || 'Orçamento',
            payment: originalQuote?.payment,
            deliveryDate: originalQuote?.deliveryDate,
        };

        setQuoteForCheckout(fullQuoteForCheckout);
        setCurrentPage('checkout');
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardPage quotes={quotes} customers={customers} products={products} accountsReceivable={accountsReceivable} accountsPayable={accountsPayable} tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} onNavigate={(page) => setCurrentPage(page)} />;
            case 'quotes': return <QuotesPage quotes={quotes} customers={customers} products={products} termsAndConditions={termsAndConditions} companyInfo={companyInfo} laborRates={laborRates} onProceedToCheckout={handleProceedToCheckout} onSave={handleSaveQuote} onDelete={handleDeleteQuote} onDuplicate={handleDuplicateQuote} />;
            case 'customers': return <CustomersPage customers={customers} quotes={quotes} customerNotes={customerNotes} onSave={handleSaveCustomer} onDelete={handleDeleteCustomer} onSaveNote={handleSaveNote} onDeleteNote={handleDeleteNote} />;
            case 'products': return <ProductsPage products={products} suppliers={suppliers} onSave={handleSaveProduct} onDelete={handleDeleteProduct} />;
            case 'suppliers': return <SuppliersPage suppliers={suppliers} onSave={handleSaveSupplier} onDelete={handleDeleteSupplier} />;
            case 'purchases': return <PurchasesPage purchaseOrders={purchaseOrders} suppliers={suppliers} products={products} onSave={handleSavePurchaseOrder} onDelete={handleDeletePurchaseOrder} onReceive={handleReceivePurchaseOrder} />;
            case 'production': return <ProductionPage quotes={quotes} products={products} companyInfo={companyInfo} onUpdateFrameStatus={handleUpdateFrameStatus} />;
            case 'financial': return <FinancialPage accountsReceivable={accountsReceivable} accountsPayable={accountsPayable} onRegisterPayment={handleRegisterPayment} onMakePayment={handleMakePayment} />;
            case 'cashflow': return <CashFlowPage sessions={cashFlowSessions} entries={cashFlowEntries} onOpenSession={handleOpenCashFlow} onAddEntry={handleAddCashFlowEntry} onCloseSession={handleCloseCashFlow} />;
            case 'reports': return <ReportsPage quotes={quotes} products={products} cashFlowEntries={cashFlowEntries} />;
            case 'settings': return <SettingsPage companyInfo={companyInfo} laborRates={laborRates} termsAndConditions={termsAndConditions} users={users} onSaveCompanyInfo={handleSaveCompanyInfo} onSaveLaborRates={handleSaveLaborRates} onSaveTerms={handleSaveTerms} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />;
            case 'account': return <AccountPage />;
            case 'studio': return <VirtualStudioPage products={products} laborRates={laborRates} onAddToQuote={handleProceedToCheckout} />;
            case 'cutting': return <CuttingPlanPage products={products} quotes={quotes} />;
            case 'checkout': return quoteForCheckout ? <CheckoutPage quote={quoteForCheckout} customers={customers} products={products} termsAndConditions={termsAndConditions} companyInfo={companyInfo} onFinalizeSale={handleFinalizeSale} onSaveAsQuote={handleSaveQuote} onSaveCustomer={handleSaveCustomer} onBack={() => { setCurrentPage('quotes'); setQuoteForCheckout(null); }} /> : <p>Error: No quote selected for checkout.</p>;
            default: return <DashboardPage quotes={quotes} customers={customers} products={products} accountsReceivable={accountsReceivable} accountsPayable={accountsPayable} tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} onNavigate={(page) => setCurrentPage(page)} />;
        }
    };
    
    if (isLoading) {
        return <div className="flex h-screen w-screen items-center justify-center">Carregando...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page)} userRole={user!.role} />
            <main className="flex-1 p-8 overflow-y-auto flex flex-col">
                {showDemoBanner && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md flex justify-between items-center no-print">
                        <p>
                            <b>Modo de Demonstração:</b> O sistema está usando dados de exemplo. Suas alterações não serão salvas permanentemente.
                        </p>
                        <button onClick={() => setShowDemoBanner(false)} className="font-bold text-xl">&times;</button>
                    </div>
                )}
                <div className="flex-grow">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;