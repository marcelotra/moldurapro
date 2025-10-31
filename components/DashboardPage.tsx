import React, { useMemo, useState } from 'react';
import { Quote, Customer, Product, AccountReceivable, AccountPayable, Task } from '../types';

interface DashboardPageProps {
    quotes: Quote[];
    customers: Customer[];
    products: Product[];
    accountsReceivable: AccountReceivable[];
    accountsPayable: AccountPayable[];
    tasks: Task[];
    onSaveTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string; completedAt?: string }) => void;
    onDeleteTask: (id: string) => void;
    onNavigate: (page: 'financial' | 'products' | 'quotes' | 'purchases' | 'cashflow' | 'customers') => void;
}

const RevenueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0-6H9.5M12 8h2.5M12 16h2.5m-4.5-1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const ProductionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const FinancialsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const AlertIcon = ({ type }: { type: 'danger' | 'warning' | 'info' }) => {
    const colors = {
        danger: 'text-red-500',
        warning: 'text-yellow-500',
        info: 'text-blue-500',
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mr-3 ${colors[type]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`${color} rounded-lg shadow-lg p-6 flex items-center`}>
        <div className="bg-white bg-opacity-20 rounded-full p-4 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-lg font-semibold text-white">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({ quotes, customers, products, accountsReceivable, accountsPayable, tasks, onSaveTask, onDeleteTask, onNavigate }) => {
    const [newTaskContent, setNewTaskContent] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    const dashboardData = useMemo(() => {
        const soldQuotes = quotes.filter(q => q.status === 'Vendido');
        const totalRevenue = soldQuotes.reduce((sum, q) => sum + (q.payment?.finalTotal || q.total), 0);
        
        const ordersInProductionCount = quotes.filter(q => 
            (q.status === 'Aprovado' || q.status === 'Vendido') && 
            q.frames.some(f => f.productionStatus !== 'Entregue')
        ).length;

        const recentSales = quotes
            .filter(q => q.status === 'Vendido')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const totalToReceive = accountsReceivable
            .filter(ar => ar.status !== 'Pago' && new Date(ar.dueDate) <= thirtyDaysFromNow)
            .reduce((sum, ar) => sum + (ar.totalAmount - ar.paidAmount), 0);
            
        const totalToPay = accountsPayable
            .filter(ap => ap.status !== 'Pago' && new Date(ap.dueDate) <= thirtyDaysFromNow)
            .reduce((sum, ap) => sum + (ap.totalAmount - ap.paidAmount), 0);


        // --- NOTIFICATIONS ---
        const today = new Date(); today.setHours(0,0,0,0);
        const sevenDaysFromNow = new Date(); sevenDaysFromNow.setDate(today.getDate() + 7);
        const threeDaysFromNow = new Date(); threeDaysFromNow.setDate(today.getDate() + 3);

        const overdueReceivables = accountsReceivable.filter(ar => ar.status !== 'Pago' && new Date(ar.dueDate) < today);
        const dueSoonPayables = accountsPayable.filter(ap => ap.status !== 'Pago' && new Date(ap.dueDate) >= today && new Date(ap.dueDate) <= sevenDaysFromNow);
        const lowStockProducts = products.filter(p => p.stockQuantity > 0 && ((p.unit === 'm²' && p.stockQuantity <= 1) || (p.unit !== 'm²' && p.stockQuantity <= 5)));
        const outOfStockProducts = products.filter(p => p.stockQuantity <= 0);
        const deliveriesDueSoon = quotes.filter(q => (q.status === 'Aprovado' || q.status === 'Vendido') && q.deliveryDate && new Date(q.deliveryDate) >= today && new Date(q.deliveryDate) <= threeDaysFromNow);

        return {
            totalRevenue,
            ordersInProductionCount,
            recentSales,
            totalToReceive,
            totalToPay,
            notifications: { overdueReceivables, dueSoonPayables, lowStockProducts, outOfStockProducts, deliveriesDueSoon }
        };
    }, [quotes, customers, products, accountsReceivable, accountsPayable]);

    const taskData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Robust date parsing function to avoid timezone issues.
        const parseDate = (dateString: string): Date => {
            const parts = dateString.split('-');
            // new Date(year, monthIndex, day) - month is 0-indexed
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        };
        
        const overdue = tasks.filter(t => !t.isCompleted && parseDate(t.dueDate) < today);
        const todayTasks = tasks.filter(t => !t.isCompleted && parseDate(t.dueDate).getTime() === today.getTime());
        const upcoming = tasks.filter(t => !t.isCompleted && parseDate(t.dueDate) > today);
        const completed = tasks.filter(t => t.isCompleted).sort((a, b) => {
            const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return dateB - dateA;
        });

        return { overdue, today: todayTasks, upcoming, completed };
    }, [tasks]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskContent.trim() && newTaskDueDate) {
            onSaveTask({
                content: newTaskContent,
                dueDate: newTaskDueDate,
                isCompleted: false,
            });
            setNewTaskContent('');
            setNewTaskDueDate('');
        }
    };

    const handleToggleTask = (task: Task) => {
        const { createdAt, ...taskData } = task;
        onSaveTask({ ...taskData, isCompleted: !task.isCompleted });
    };

    const allNotifications = [
        ...dashboardData.notifications.overdueReceivables.map(ar => ({ type: 'danger' as const, message: `Recebimento de ${ar.customerName} (R$ ${(ar.totalAmount - ar.paidAmount).toFixed(2)}) está vencido.`, action: () => onNavigate('financial') })),
        ...dashboardData.notifications.outOfStockProducts.map(p => ({ type: 'danger' as const, message: `Produto "${p.name}" está esgotado.`, action: () => onNavigate('products') })),
        ...dashboardData.notifications.dueSoonPayables.map(ap => ({ type: 'warning' as const, message: `Pagamento para ${ap.supplierName} (R$ ${(ap.totalAmount - ap.paidAmount).toFixed(2)}) vence em breve.`, action: () => onNavigate('financial') })),
        ...dashboardData.notifications.lowStockProducts.map(p => ({ type: 'warning' as const, message: `Produto "${p.name}" está com estoque baixo (${p.stockQuantity.toFixed(2)} ${p.unit}).`, action: () => onNavigate('products') })),
        ...dashboardData.notifications.deliveriesDueSoon.map(q => ({ type: 'info' as const, message: `Entrega do pedido #${q.quoteNumber} para ${q.customerName} está próxima.`, action: () => onNavigate('quotes') })),
    ];

    const renderTaskList = (taskList: Task[], title: string, titleColor: string) => (
        <div>
            <h3 className={`text-md font-semibold ${titleColor} mb-2`}>{title}</h3>
            {taskList.length > 0 ? (
                <ul className="space-y-2">
                    {taskList.map(task => (
                        <li key={task.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center">
                                <input type="checkbox" checked={task.isCompleted} onChange={() => handleToggleTask(task)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 mr-3" />
                                <span className={`text-sm ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.content}</span>
                            </div>
                             <div className="flex items-center">
                                <span className={`text-xs font-medium mr-3 ${task.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(task.dueDate).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                                <button onClick={() => onDeleteTask(task.id)} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-400 italic">Nenhuma tarefa aqui.</p>}
        </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Controle</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Faturamento (Vendas)" value={`R$ ${dashboardData.totalRevenue.toFixed(2)}`} icon={<RevenueIcon />} color="bg-green-500" />
                <StatCard title="A Receber (30 dias)" value={`R$ ${dashboardData.totalToReceive.toFixed(2)}`} icon={<FinancialsIcon />} color="bg-blue-500" />
                <StatCard title="A Pagar (30 dias)" value={`R$ ${dashboardData.totalToPay.toFixed(2)}`} icon={<FinancialsIcon />} color="bg-red-500" />
                <StatCard title="Pedidos em Produção" value={dashboardData.ordersInProductionCount} icon={<ProductionIcon />} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Alerts & Tasks Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Central de Alertas</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {allNotifications.length > 0 ? allNotifications.map((note, index) => (
                                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                                        <AlertIcon type={note.type} />
                                        <span className="text-sm text-gray-700 flex-grow">{note.message}</span>
                                        <button onClick={note.action} className="text-sm text-indigo-600 font-semibold hover:underline whitespace-nowrap ml-4">
                                            Ver
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-center py-4 text-gray-500">Nenhum alerta no momento.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Agenda de Tarefas</h2>
                            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                                <input type="text" value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} placeholder="Nova tarefa..." className="flex-grow p-2 border rounded-md"/>
                                <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className="p-2 border rounded-md"/>
                                <button type="submit" className="p-2 bg-indigo-600 text-white rounded-md font-semibold">+</button>
                            </form>
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                {renderTaskList(taskData.overdue, 'Vencidas', 'text-red-600')}
                                {renderTaskList(taskData.today, 'Para Hoje', 'text-blue-600')}
                                {renderTaskList(taskData.upcoming, 'Próximas', 'text-gray-700')}
                                {taskData.completed.length > 0 && renderTaskList(taskData.completed, 'Concluídas', 'text-green-600')}
                            </div>
                        </div>
                    </div>

                     {/* Recent Sales */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Vendas Recentes</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nº</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.recentSales.length > 0 ? dashboardData.recentSales.map(quote => (
                                        <tr key={quote.id}>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm">{quote.quoteNumber}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm">{quote.customerName}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm">{new Date(quote.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-right font-semibold">R$ {quote.total.toFixed(2)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 text-gray-500">Nenhuma venda recente.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Atalhos Rápidos</h2>
                    <div className="space-y-3">
                        <button onClick={() => onNavigate('quotes')} className="w-full text-left p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                            <p className="font-semibold text-indigo-800">Novo Orçamento</p>
                            <p className="text-sm text-indigo-600">Criar um novo pedido para um cliente.</p>
                        </button>
                         <button onClick={() => onNavigate('purchases')} className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                            <p className="font-semibold text-green-800">Registrar Compra</p>
                            <p className="text-sm text-green-600">Dar entrada em novos materiais e atualizar estoque.</p>
                        </button>
                         <button onClick={() => onNavigate('cashflow')} className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                            <p className="font-semibold text-yellow-800">Ver Caixa</p>
                            <p className="text-sm text-yellow-600">Conferir as movimentações do dia.</p>
                        </button>
                         <button onClick={() => onNavigate('customers')} className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            <p className="font-semibold text-blue-800">Novo Cliente</p>
                            <p className="text-sm text-blue-600">Cadastrar um novo cliente no sistema.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;