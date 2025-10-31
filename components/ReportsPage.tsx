import React, { useState, useMemo } from 'react';
import { Quote, Product, CashFlowEntry } from '../types';
import BarChart from './BarChart';
import PieChart from './PieChart';

interface ReportsPageProps {
    quotes: Quote[];
    products: Product[];
    cashFlowEntries: CashFlowEntry[];
}

const StatCard: React.FC<{ title: string; value: string; subValue?: string; color: string }> = ({ title, value, subValue, color }) => (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${color}`}>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subValue && <p className="text-sm text-gray-600">{subValue}</p>}
    </div>
);

const ReportsPage: React.FC<ReportsPageProps> = ({ quotes, products, cashFlowEntries }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(todayStr);

    const reportData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const salesInPeriod = quotes.filter(q => {
            const saleDate = new Date(q.createdAt);
            return q.status === 'Vendido' && saleDate >= start && saleDate <= end;
        });

        const totalRevenue = salesInPeriod.reduce((sum, q) => sum + q.total, 0);
        const totalCost = salesInPeriod.reduce((sum, q) => {
            const quoteCost = q.frames.reduce((cost, f) => cost + (f.totalCost * f.quantity), 0);
            return sum + quoteCost;
        }, 0);
        const totalProfit = totalRevenue - totalCost;
        const salesCount = salesInPeriod.length;
        const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
        const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Product sales analysis (simplified)
        const productStats: { [key: string]: { name: string; code: string; quantity: number; revenue: number; profit: number } } = {};
        salesInPeriod.forEach(quote => {
            quote.frames.forEach(frame => {
                const frameProductIds = [frame.frame1Id, frame.frame2Id, frame.glassId, frame.backingId, frame.passepartoutId].filter(Boolean) as string[];
                frameProductIds.forEach(pId => {
                    const product = products.find(p => p.id === pId);
                    if (product) {
                        if (!productStats[pId]) productStats[pId] = { name: product.name, code: product.code, quantity: 0, revenue: 0, profit: 0 };
                        productStats[pId].quantity += frame.quantity;
                        productStats[pId].revenue += (frame.totalPrice * frame.quantity) / frameProductIds.length;
                        productStats[pId].profit += ((frame.totalPrice - frame.totalCost) * frame.quantity) / frameProductIds.length;
                    }
                });
            });
        });

        const bestSellersByRevenue = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        const bestSellersByProfit = Object.values(productStats).sort((a, b) => b.profit - a.profit).slice(0, 10);

        return {
            salesInPeriod, totalRevenue, totalCost, totalProfit, salesCount,
            averageTicket, averageMargin, bestSellersByRevenue, bestSellersByProfit
        };
    }, [quotes, products, startDate, endDate]);

    const chartData = useMemo(() => {
        // Monthly Revenue & Profit (last 6 months)
        const monthlyData: { [key: string]: { revenue: number; profit: number } } = {};
        const monthLabels: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthLabels.push(new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(d));
            monthlyData[monthKey] = { revenue: 0, profit: 0 };
        }
        
        quotes.filter(q => q.status === 'Vendido').forEach(q => {
            const saleDate = new Date(q.createdAt);
            const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[monthKey]) {
                const quoteCost = q.frames.reduce((sum, f) => sum + (f.totalCost * f.quantity), 0);
                monthlyData[monthKey].revenue += q.total;
                monthlyData[monthKey].profit += (q.total - quoteCost);
            }
        });
        
        const monthlyChart = {
            labels: monthLabels,
            datasets: [
                { label: 'Faturamento', data: Object.values(monthlyData).map(d => d.revenue), color: '#34D399' },
                { label: 'Lucro', data: Object.values(monthlyData).map(d => d.profit), color: '#60A5FA' },
            ]
        };

        // Payment Methods Pie Chart (for selected period)
        const paymentMethodData = reportData.salesInPeriod.reduce((acc, q) => {
            const method = q.payment?.method || 'N/A';
            acc[method] = (acc[method] || 0) + q.total;
            return acc;
        }, {} as Record<string, number>);
        
        const paymentChart = {
            labels: Object.keys(paymentMethodData),
            datasets: [{ data: Object.values(paymentMethodData) }]
        };

        // Cash Flow Chart (for selected period)
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        const entriesInPeriod = cashFlowEntries.filter(e => {
            const entryDate = new Date(e.createdAt);
            return entryDate >= start && entryDate <= end;
        });
        const totalInflow = entriesInPeriod.filter(e => e.type === 'entrada').reduce((sum, e) => sum + e.amount, 0);
        const totalOutflow = entriesInPeriod.filter(e => e.type === 'saida').reduce((sum, e) => sum + e.amount, 0);
        
        const cashFlowChart = {
            labels: ['Fluxo de Caixa'],
            datasets: [
                { label: 'Entradas', data: [totalInflow], color: '#34D399' },
                { label: 'Saídas', data: [totalOutflow], color: '#F87171' },
            ]
        };

        return { monthlyChart, paymentChart, cashFlowChart };

    }, [quotes, cashFlowEntries, startDate, endDate, reportData.salesInPeriod]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios Gerenciais</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtrar por Período</h2>
                <div className="flex items-center space-x-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Data de Início</label>
                        <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Data Final</label>
                        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold text-gray-800 mb-4">Faturamento vs. Lucro (Últimos 6 meses)</h2>
                     <div style={{ height: '300px' }}>
                        <BarChart data={chartData.monthlyChart} />
                     </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">Vendas por Forma de Pagamento</h2>
                         <div style={{ height: '300px' }}>
                            <PieChart data={chartData.paymentChart} />
                         </div>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">Análise do Caixa</h2>
                         <div style={{ height: '300px' }}>
                            <BarChart data={chartData.cashFlowChart} showLabels={false}/>
                         </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Faturamento no Período" value={`R$ ${reportData.totalRevenue.toFixed(2)}`} subValue={`${reportData.salesCount} vendas`} color="border-green-500" />
                <StatCard title="Lucro no Período" value={`R$ ${reportData.totalProfit.toFixed(2)}`} subValue={`Margem de ${reportData.averageMargin.toFixed(2)}%`} color="border-blue-500" />
                <StatCard title="Ticket Médio" value={`R$ ${reportData.averageTicket.toFixed(2)}`} subValue={`Custo Total R$ ${reportData.totalCost.toFixed(2)}`} color="border-yellow-500" />
            </div>

            {/* Sales Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes das Vendas no Período</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Nº</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Custo</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Lucro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.salesInPeriod.map(q => {
                                const cost = q.frames.reduce((sum, f) => sum + (f.totalCost * f.quantity), 0);
                                const profit = q.total - cost;
                                return (
                                <tr key={q.id}>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">{new Date(q.createdAt).toLocaleDateString()}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">{q.quoteNumber}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">{q.customerName}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right font-semibold">R$ {q.total.toFixed(2)}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right text-red-600">R$ {cost.toFixed(2)}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right font-semibold text-green-600">R$ {profit.toFixed(2)}</td>
                                </tr>
                                )
                            })}
                            {reportData.salesInPeriod.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma venda encontrada no período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;