import React, { useState, useMemo } from 'react';
import { Product, Supplier, ProductType } from '../types';
import ProductForm from './ProductForm';

interface ProductsPageProps {
    products: Product[];
    suppliers: Supplier[];
    onSave: (product: Omit<Product, 'id'> & { id?: string }) => void;
    onDelete: (productId: string) => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products, suppliers, onSave, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter States
    const [filterType, setFilterType] = useState<string>('all');
    const [filterSupplier, setFilterSupplier] = useState<string>('all');
    const [filterStock, setFilterStock] = useState<string>('all');


    const handleSave = (product: Omit<Product, 'id'> & { id?: string }) => {
        onSave(product);
        setIsFormOpen(false);
        setSelectedProduct(null);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProduct(null);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedProduct(null);
    };
    
    const getSupplierName = (supplierId: string | null) => {
        if (!supplierId) return <span className="text-gray-400">N/A</span>;
        return suppliers.find(s => s.id === supplierId)?.name || 'Desconhecido';
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Search term
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  p.code.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Type filter
            if (filterType !== 'all' && p.productType !== filterType) return false;

            // Supplier filter
            if (filterSupplier !== 'all' && p.supplierId !== filterSupplier) return false;

            // Stock filter
            if (filterStock === 'low') {
                const isLow = p.stockQuantity > 0 && (
                    (p.unit === 'm²' && p.stockQuantity <= 1) ||
                    (p.unit !== 'm²' && p.stockQuantity <= 5)
                );
                if (!isLow) return false;
            } else if (filterStock === 'out') {
                if (p.stockQuantity > 0) return false;
            }
            
            return true;
        });
    }, [products, searchTerm, filterType, filterSupplier, filterStock]);
    
    const productTypes: { value: ProductType, label: string }[] = [
        { value: 'moldura', label: 'Moldura' },
        { value: 'vidro', label: 'Vidro' },
        { value: 'fundo', label: 'Fundo' },
        { value: 'passe-partout', label: 'Passe-partout' },
        { value: 'substrato', label: 'Substrato' },
        { value: 'servico', label: 'Serviço' },
        { value: 'chassis', label: 'Chassis' },
        { value: 'impressao', label: 'Impressão' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
                 <button onClick={handleAddNew} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition whitespace-nowrap">
                        Adicionar Produto
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <input 
                        type="text"
                        placeholder="Buscar por nome ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="all">Todos os Tipos</option>
                        {productTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                    </select>
                     <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="all">Todos Fornecedores</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                     <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="all">Todo o Estoque</option>
                        <option value="low">Estoque Baixo</option>
                        <option value="out">Esgotado</option>
                    </select>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Produto</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fornecedor</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estoque</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Custo</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Preço</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <div className="flex items-center">
                                        {product.imageUrl && (
                                            <div className="flex-shrink-0 w-12 h-12 mr-3">
                                                <img className="w-full h-full rounded-md object-cover" src={product.imageUrl} alt={product.name} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-gray-900 whitespace-no-wrap">{product.name}</p>
                                            {product.productType === 'moldura' && (
                                                <p className="text-gray-600 whitespace-no-wrap text-xs">
                                                    {product.width}cm x {product.length}m
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{product.code}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{getSupplierName(product.supplierId)}</td>
                                 <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`font-semibold ${
                                        product.stockQuantity <= 0 ? 'text-red-600' :
                                        (product.unit === 'm²' && product.stockQuantity <= 1) || (product.unit !== 'm²' && product.stockQuantity <= 5) ? 'text-yellow-600' : 'text-gray-900'
                                    }`}>
                                        {product.stockQuantity.toFixed(2)} {product.unit}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">R$ {product.cost.toFixed(2)}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">R$ {product.price.toFixed(2)}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium">Editar</button>
                                    <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-900 font-medium">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && <ProductForm product={selectedProduct} suppliers={suppliers} onSave={handleSave} onClose={handleCloseForm} />}
        </div>
    );
};

export default ProductsPage;