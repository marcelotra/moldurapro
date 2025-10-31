import React, { useState, useMemo } from 'react';
import { Product, ProductType } from '../types';

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProduct: (product: Product) => void;
    products: Product[];
    productType: ProductType;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelectProduct, products, productType }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.productType === productType &&
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, productType, searchTerm]);

    if (!isOpen) return null;

    const productTypeLabels: Record<ProductType, string> = {
        'moldura': 'Molduras',
        'vidro': 'Vidros',
        'fundo': 'Fundos',
        'passe-partout': 'Passe-partout',
        'substrato': 'Substratos',
        'servico': 'Serviços',
        'chassis': 'Chassis',
        'impressao': 'Impressões',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Selecionar {productTypeLabels[productType] || 'Produto'}</h2>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou código..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                        autoFocus
                    />
                </div>
                
                <div className="flex-grow overflow-y-auto p-4">
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <li 
                                key={product.id} 
                                onClick={() => onSelectProduct(product)} 
                                className="border rounded-lg p-2 cursor-pointer hover:bg-indigo-50 hover:shadow-lg hover:border-indigo-300 transition-all duration-150 flex flex-col justify-between"
                            >
                                <div className="w-full h-32 mb-2 flex items-center justify-center bg-gray-100 rounded">
                                     <img src={product.imageUrl || 'https://via.placeholder.com/150x150?text=Sem+Foto'} alt={product.name} className="max-w-full max-h-full object-contain rounded" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 truncate" title={product.name}>{product.name}</p>
                                    <p className="text-xs text-gray-500">{product.code}</p>
                                </div>
                            </li>
                        ))}
                        {filteredProducts.length === 0 && (
                            <li className="col-span-full text-center py-10 text-gray-500">
                                Nenhum produto encontrado.
                            </li>
                        )}
                    </ul>
                </div>
                
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionModal;