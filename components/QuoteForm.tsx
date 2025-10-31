import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Quote, Customer, Product, FrameConfiguration, ProductType, LaborRate } from '../types';
import ProductSelectionModal from './ProductSelectionModal';

interface QuoteFormProps {
    quote: Quote | null;
    customers: Customer[];
    products: Product[];
    laborRates: LaborRate[];
    onProceedToCheckout: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => void;
    onSaveDraft: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => void;
    onCancel: () => void;
}

const initialFrameState: Omit<FrameConfiguration, 'id' | 'totalPrice' | 'totalCost'> = {
    name: '',
    width: 0,
    height: 0,
    quantity: 1,
    imageUrl: '',
    passepartoutWidth: 0,
    glassMargin: 0,
    printingMargin: 0,
    extraProduct: { name: '', price: 0 },
    observations: '',
    includeFrame1WasteCost: false,
    includeFrame2WasteCost: false,
};

type ProductCodeFields = 'frame1' | 'frame2' | 'glass' | 'backing' | 'passepartout' | 'chassis' | 'printing' | 'substrato' | 'servico';

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, customers, products, laborRates, onProceedToCheckout, onSaveDraft, onCancel }) => {
    const [frames, setFrames] = useState<FrameConfiguration[]>([]);
    const [currentFrame, setCurrentFrame] = useState(initialFrameState);
    const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState('');
    const [status, setStatus] = useState<'Orçamento' | 'Aprovado' | 'Recusado' | 'Vendido'>('Orçamento');
    const [surcharge, setSurcharge] = useState(0);
    const [surchargeType, setSurchargeType] = useState<'fixed' | 'percentage'>('fixed');
    const observationsRef = useRef<HTMLTextAreaElement>(null);
    const [showDetailsConfirmation, setShowDetailsConfirmation] = useState(false);


    // State for product code inputs
    const initialProductCodes = {
        frame1: '', frame2: '', glass: '', backing: '', passepartout: '', chassis: '', printing: '', substrato: '', servico: ''
    };
    const [productCodes, setProductCodes] = useState(initialProductCodes);
    const [stockInfo, setStockInfo] = useState<Record<ProductCodeFields, string | null>>(initialProductCodes);

    // State for the product selection modal
    const [productModalState, setProductModalState] = useState<{
        isOpen: boolean;
        productType: ProductType | null;
        fieldToUpdate: ProductCodeFields | null;
    }>({ isOpen: false, productType: null, fieldToUpdate: null });


    useEffect(() => {
        if (quote) {
            setFrames(quote.frames);
            setCustomerId(quote.customerId);
            setStatus(quote.status);
            setSurcharge(quote.surcharge || 0);
            setSurchargeType(quote.surchargeType || 'fixed');
        } else {
            setFrames([]);
            setCustomerId(customers[0]?.id || '');
            setStatus('Orçamento');
            setSurcharge(0);
            setSurchargeType('fixed');
        }
    }, [quote, customers]);

    const handleFrameFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumber = ['width', 'height', 'quantity', 'passepartoutWidth', 'glassMargin', 'printingMargin'].includes(name);
        setCurrentFrame(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentFrame(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleExtraProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentFrame(prev => ({
            ...prev,
            extraProduct: {
                ...prev.extraProduct,
                [name]: name === 'price' ? parseFloat(value) || 0 : value
            }
        }));
    };

    const handleWasteCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setCurrentFrame(prev => ({ ...prev, [name]: checked }));
    };

    const handleProductionStatusChange = (frameId: string, status: FrameConfiguration['productionStatus']) => {
        setFrames(frames.map(f => {
            if (f.id === frameId) {
                return { 
                    ...f, 
                    productionStatus: status,
                    deliveryDate: status === 'Entregue' ? (f.deliveryDate || new Date().toISOString()) : undefined
                };
            }
            return f;
        }));
    };

    const calculatedData = useMemo(() => {
        const { width, height, passepartoutWidth, frame1Id, frame2Id, glassMargin, printingMargin, chassisId, quantity } = currentFrame;
        const frame1 = products.find(p => p.id === frame1Id);
        const frame2 = products.find(p => p.id === frame2Id);
        const chassis = products.find(p => p.id === chassisId);

        const frame1ProfileWidth = frame1?.width || 0;
        const frame2ProfileWidth = frame2?.width || 0;

        // This is the size of the inner components like glass, backing, and passe-partout
        const sheetRequiredWidth = width + (printingMargin * 2) + (glassMargin * 2) + (passepartoutWidth * 2);
        const sheetRequiredHeight = height + (printingMargin * 2) + (glassMargin * 2) + (passepartoutWidth * 2);

        // --- Frame 1 (Inner Frame) Calculations ---
        const frame1ExternalWidth = sheetRequiredWidth + (frame1ProfileWidth * 2);
        const frame1ExternalHeight = sheetRequiredHeight + (frame1ProfileWidth * 2);
        const frame1PerimeterM = (frame1ExternalWidth / 100) * 2 + (frame1ExternalHeight / 100) * 2;
        const frame1PerimeterCm = frame1PerimeterM * 100;

        // --- Frame 2 (Outer Frame) Calculations ---
        const frame2ExternalWidth = frame1ExternalWidth + (frame2ProfileWidth * 2);
        const frame2ExternalHeight = frame1ExternalHeight + (frame2ProfileWidth * 2);
        const frame2PerimeterM = (frame2ExternalWidth / 100) * 2 + (frame2ExternalHeight / 100) * 2;
        const frame2PerimeterCm = frame2PerimeterM * 100;
        
        const chassisPerimeterCm = ((width / 100) * 2 + (height / 100) * 2) * 100;

        const items: { name: string; price: number; cost: number, type: string; }[] = [];

        const calcSheetPriceAndCost = (pId?: string, type?: string) => {
            const product = products.find(p => p.id === pId);
            if (!product || !type) return;
            const areaM2 = (sheetRequiredWidth / 100) * (sheetRequiredHeight / 100);
            items.push({ name: product.name, price: areaM2 * product.price, cost: areaM2 * product.cost, type });
        };
        
        const calcUnitPriceAndCost = (pId?: string, type?: string) => {
            const product = products.find(p => p.id === pId);
            if (!product || !type) return;
            items.push({ name: product.name, price: product.price, cost: product.cost, type });
        };
        
        if (frame1) {
            items.push({ name: frame1.name, price: frame1PerimeterM * frame1.price, cost: frame1PerimeterM * frame1.cost, type: 'Primeira Moldura' });
        }
        if (frame2) {
            items.push({ name: frame2.name, price: frame2PerimeterM * frame2.price, cost: frame2PerimeterM * frame2.cost, type: 'Segunda Moldura' });
        }

        calcSheetPriceAndCost(currentFrame.glassId, 'Vidro');
        calcSheetPriceAndCost(currentFrame.backingId, 'Fundo');
        calcSheetPriceAndCost(currentFrame.passepartoutId, 'Paspatur');
        calcSheetPriceAndCost(currentFrame.substratoId, 'Substrato');
        
        calcUnitPriceAndCost(currentFrame.printingId, 'Impressão');
        calcUnitPriceAndCost(currentFrame.servicoId, 'Serviço');

        if (chassis) {
            const chassisPerimeterM = chassisPerimeterCm / 100;
            items.push({ name: chassis.name, price: chassisPerimeterM * chassis.price, cost: chassisPerimeterM * chassis.cost, type: 'Chassis'});
        }
        
        // --- Labor Cost Calculation ---
        const largestPerimeterCm = Math.max(frame1PerimeterCm, frame2PerimeterCm, chassisPerimeterCm);
        if (largestPerimeterCm > 0 && laborRates.length > 0) {
            const sortedRates = [...laborRates].sort((a, b) => b.minPerimeter - a.minPerimeter);
            const applicableRate = sortedRates.find(rate => largestPerimeterCm >= rate.minPerimeter);
            const laborPrice = applicableRate ? applicableRate.price : 0;
            if (laborPrice > 0) {
                 items.push({ name: 'Mão de Obra', price: laborPrice, cost: 0, type: 'Mão de Obra' });
            }
        }
        
        if(currentFrame.extraProduct.price > 0 && currentFrame.extraProduct.name.trim() !== '') {
             items.push({ name: currentFrame.extraProduct.name, price: currentFrame.extraProduct.price, cost: 0, type: 'Extra' }); // Assume cost is 0 for extra product for now
        }
        
        const calculateWaste = (frameProduct?: Product, perimeterCm?: number) => {
            if (!frameProduct || !frameProduct.length || frameProduct.length <= 0 || !frameProduct.cost || !perimeterCm || perimeterCm <= 0) {
                return { usedCm: 0, wasteCm: 0, wasteCost: 0, barsNeeded: 0 };
            }
            const barLengthCm = frameProduct.length * 100;
            const barsNeeded = Math.ceil(perimeterCm / barLengthCm);
            const totalPurchasedCm = barsNeeded * barLengthCm;
            const wasteCm = totalPurchasedCm - perimeterCm;
            const costPerMeter = frameProduct.cost;
            const costPerCm = costPerMeter / 100;
            const wasteCost = wasteCm * costPerCm;
            return { usedCm: perimeterCm, wasteCm, wasteCost, barsNeeded };
        };
        
        const totalFrame1PerimeterCm = frame1PerimeterCm * quantity;
        const totalFrame2PerimeterCm = frame2PerimeterCm * quantity;
        
        const frame1Waste = calculateWaste(frame1, totalFrame1PerimeterCm);
        const frame2Waste = calculateWaste(frame2, totalFrame2PerimeterCm);

        let totalPrice = items.reduce((sum, item) => sum + item.price, 0);
        let totalCost = items.reduce((sum, item) => sum + item.cost, 0);

        if (currentFrame.includeFrame1WasteCost) {
            totalPrice += frame1Waste.wasteCost / (quantity || 1);
        }
        if (currentFrame.includeFrame2WasteCost) {
            totalPrice += frame2Waste.wasteCost / (quantity || 1);
        }

        return { 
            internalWidth: width, 
            internalHeight: height, 
            externalWidth: frame2ProfileWidth > 0 ? frame2ExternalWidth : frame1ExternalWidth, 
            externalHeight: frame2ProfileWidth > 0 ? frame2ExternalHeight : frame1ExternalHeight, 
            items, 
            totalPrice, 
            totalCost,
            frame1Waste, 
            frame2Waste, 
            sheetRequiredWidth, 
            sheetRequiredHeight 
        };
    }, [currentFrame, products, laborRates]);

    const validateSheetSize = useCallback((productId: string | undefined, requiredW: number, requiredH: number, productTypeName: string): boolean => {
        if (!productId) return true;
        const product = products.find(p => p.id === productId);

        if (product && ['passe-partout', 'vidro', 'fundo', 'substrato'].includes(product.productType)) {
            const sheetW = product.sheetWidth || 0;
            const sheetH = product.sheetHeight || 0;

            if (sheetW <= 0 || sheetH <= 0) {
                alert(`As dimensões da chapa para o ${productTypeName} (${product.name}) não são válidas. Verifique o cadastro do produto.`);
                return false;
            }
            
            const roundedW = parseFloat(requiredW.toFixed(4));
            const roundedH = parseFloat(requiredH.toFixed(4));

            const canBeCut = (roundedW <= sheetW && roundedH <= sheetH) ||
                             (roundedW <= sheetH && roundedH <= sheetW);
            
            if (!canBeCut) {
                alert(`O tamanho necessário para o ${productTypeName} (${requiredW.toFixed(2)} x ${requiredH.toFixed(2)} cm) excede o tamanho da chapa do produto selecionado (${sheetW} x ${sheetH} cm).`);
                return false;
            }
        }
        return true;
    }, [products]);
    
    const handleCancelEdit = () => {
        setEditingFrameId(null);
        setCurrentFrame(initialFrameState);
        setProductCodes(initialProductCodes);
        setStockInfo(initialProductCodes);
    };

    const executeSaveFrame = () => {
        if (editingFrameId) {
            const updatedFrame: FrameConfiguration = {
                ...currentFrame,
                id: editingFrameId,
                totalPrice: calculatedData.totalPrice,
                totalCost: calculatedData.totalCost,
            };
            setFrames(frames.map(f => f.id === editingFrameId ? updatedFrame : f));
        } else {
            const newFrame: FrameConfiguration = {
                ...currentFrame,
                id: new Date().toISOString(),
                totalPrice: calculatedData.totalPrice,
                totalCost: calculatedData.totalCost,
            };
            setFrames(prev => [...prev, newFrame]);
        }
        handleCancelEdit();
    };
    
    const handleSaveFrameClick = () => {
        if (currentFrame.width <= 0 || currentFrame.height <= 0) {
            alert("Preencha ao menos Largura e Altura.");
            return;
        }
        
        const hasAnyProduct = Object.values(currentFrame).some(val => typeof val === 'string' && val.startsWith('p')) ||
                             (currentFrame.extraProduct.name.trim() !== '' && currentFrame.extraProduct.price > 0);

        if (!hasAnyProduct) {
            alert("Adicione pelo menos um item (moldura, vidro, etc.) ou preencha o campo 'Produto Extra' com nome e preço.");
            return;
        }
        
        const { sheetRequiredWidth, sheetRequiredHeight } = calculatedData;
        if (!validateSheetSize(currentFrame.passepartoutId, sheetRequiredWidth, sheetRequiredHeight, "Paspatur")) return;
        if (!validateSheetSize(currentFrame.glassId, sheetRequiredWidth, sheetRequiredHeight, "Vidro")) return;
        if (!validateSheetSize(currentFrame.backingId, sheetRequiredWidth, sheetRequiredHeight, "Fundo")) return;
        if (!validateSheetSize(currentFrame.substratoId, sheetRequiredWidth, sheetRequiredHeight, "Substrato")) return;

        if (currentFrame.observations.trim() === '') {
            setShowDetailsConfirmation(true);
        } else {
            executeSaveFrame();
        }
    };

    const handleEditFrame = (frameId: string) => {
        const frameToEdit = frames.find(f => f.id === frameId);
        if (frameToEdit) {
            setEditingFrameId(frameId);
            setCurrentFrame({ ...frameToEdit });
            
            const codes: Record<ProductCodeFields, string> = {
                frame1: products.find(p => p.id === frameToEdit.frame1Id)?.code || '',
                frame2: products.find(p => p.id === frameToEdit.frame2Id)?.code || '',
                glass: products.find(p => p.id === frameToEdit.glassId)?.code || '',
                backing: products.find(p => p.id === frameToEdit.backingId)?.code || '',
                passepartout: products.find(p => p.id === frameToEdit.passepartoutId)?.code || '',
                chassis: products.find(p => p.id === frameToEdit.chassisId)?.code || '',
                printing: products.find(p => p.id === frameToEdit.printingId)?.code || '',
                substrato: products.find(p => p.id === frameToEdit.substratoId)?.code || '',
                servico: products.find(p => p.id === frameToEdit.servicoId)?.code || '',
            };
            setProductCodes(codes);
            
            const stock: Record<ProductCodeFields, string | null> = { ...initialProductCodes };
            Object.keys(codes).forEach(key => {
                const pId = frameToEdit[`${key}Id` as keyof FrameConfiguration];
                if (pId) {
                    const product = products.find(p => p.id === pId);
                    if (product) {
                        stock[key as ProductCodeFields] = `${product.stockQuantity.toFixed(2)} ${product.unit}`;
                    }
                }
            });
            setStockInfo(stock);
        }
    };


    const handleRemoveFrame = (id: string) => {
        setFrames(frames.filter(f => f.id !== id));
    };

    const buildQuoteObject = () => {
         if (frames.length === 0) {
            alert("Adicione pelo menos um quadro ao pedido antes de salvar.");
            return null;
        }
        if (!customerId) {
            alert("Selecione um cliente para o orçamento.");
            return null;
        }
        const customer = customers.find(c => c.id === customerId);
        
        // Surcharge distribution logic
        const subtotal = frames.reduce((sum, f) => sum + (f.totalPrice * f.quantity), 0);
        const surchargeAmount = surchargeType === 'percentage' ? subtotal * (surcharge / 100) : surcharge;
        
        let framesWithSurcharge: FrameConfiguration[] = frames;

        if (subtotal > 0 && surchargeAmount > 0) {
            framesWithSurcharge = frames.map(frame => {
                const frameTotal = frame.totalPrice * frame.quantity;
                const proportion = frameTotal / subtotal;
                const surchargeForFrame = surchargeAmount * proportion;
                const surchargePerItem = surchargeForFrame / frame.quantity;
                
                return {
                    ...frame,
                    totalPrice: frame.totalPrice + surchargePerItem
                };
            });
        }

        return {
            id: quote?.id,
            customerId,
            customerName: customer?.name || 'Cliente não encontrado',
            frames: framesWithSurcharge,
            surcharge,      // Keep for internal reference
            surchargeType,  // Keep for internal reference
            status,
        };
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const quoteToSave = buildQuoteObject();
        if (quoteToSave) {
            onProceedToCheckout(quoteToSave);
        }
    };

    const handleDraftSave = () => {
        const quoteToSave = buildQuoteObject();
        if (quoteToSave) {
            onSaveDraft(quoteToSave);
        }
    }

    const handleOpenProductModal = (field: ProductCodeFields, type: ProductType) => {
        setProductModalState({ isOpen: true, productType: type, fieldToUpdate: field });
    };

    const handleProductSelect = (product: Product) => {
        const { fieldToUpdate } = productModalState;
        if (fieldToUpdate) {
            setProductCodes(prev => ({ ...prev, [fieldToUpdate]: product.code }));
            
            const fieldId = `${String(fieldToUpdate)}Id` as keyof FrameConfiguration;
            setCurrentFrame(prev => ({ ...prev, [fieldId]: product.id }));

            setStockInfo(prev => ({ ...prev, [fieldToUpdate]: `${product.stockQuantity.toFixed(2)} ${product.unit}` }));
        }
        setProductModalState({ isOpen: false, productType: null, fieldToUpdate: null });
    };

    const handleClearProduct = (field: ProductCodeFields) => {
        setProductCodes(prev => ({ ...prev, [field]: '' }));
        const fieldId = `${String(field)}Id` as keyof FrameConfiguration;
        setCurrentFrame(prev => ({ ...prev, [fieldId]: undefined }));
        setStockInfo(prev => ({ ...prev, [field]: null }));
    };

    const renderProductSelector = (field: ProductCodeFields, type: ProductType, label: string) => {
        const selectedProductId = currentFrame[`${field}Id` as keyof FrameConfiguration] as string | undefined;
        const selectedProduct = products.find(p => p.id === selectedProductId);

        return (
            <div>
                <div className="flex justify-between items-baseline">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    {stockInfo[field] && <span className="text-xs font-mono text-gray-500">Estoque: {stockInfo[field]}</span>}
                </div>
                <div className="mt-1 flex items-center p-2 border border-gray-300 rounded-md bg-gray-50 min-h-[58px]">
                    {selectedProduct ? (
                        <div className="flex-grow flex items-center">
                            {selectedProduct.imageUrl && <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-10 w-10 rounded-sm object-cover mr-3" />}
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{selectedProduct.name}</p>
                                <p className="text-xs text-gray-500">{selectedProduct.code}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow text-sm text-gray-500">Nenhum selecionado</div>
                    )}
                    <div className="flex space-x-1 ml-2">
                        <button type="button" onClick={() => handleOpenProductModal(field, type)} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded hover:bg-indigo-200">Selecionar</button>
                        {selectedProduct && <button type="button" onClick={() => handleClearProduct(field)} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200">&times;</button>}
                    </div>
                </div>
            </div>
        );
    };

    const renderWasteSection = (frameId: string | undefined, wasteData: any, name: string, checkboxName: 'includeFrame1WasteCost' | 'includeFrame2WasteCost') => {
        const product = products.find(p => p.id === frameId);
        if (!product || !wasteData || wasteData.usedCm <= 0) return null;

        return (
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-700">Aproveitamento {name}</h3>
                <div className="space-y-1 text-sm mt-2">
                    <div className="flex justify-between">
                        <span>Barra de {product.length}m:</span>
                        <span className="font-medium">{wasteData.barsNeeded} un</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Utilizado:</span>
                        <span className="font-medium">{wasteData.usedCm.toFixed(2)} cm</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Sobra:</span>
                        <span className="font-medium">{wasteData.wasteCm.toFixed(2)} cm</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <label htmlFor={checkboxName} className="flex items-center space-x-2 cursor-pointer flex-grow">
                            <input
                                type="checkbox"
                                id={checkboxName}
                                name={checkboxName}
                                checked={!!currentFrame[checkboxName]}
                                onChange={handleWasteCheckboxChange}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Custo da Sobra:</span>
                        </label>
                        <span className="font-medium">R$ {wasteData.wasteCost.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    };

    const subtotal = frames.reduce((sum, f) => sum + (f.totalPrice * f.quantity), 0);
    const totalCost = frames.reduce((sum, f) => sum + (f.totalCost * f.quantity), 0);
    const surchargeAmount = surchargeType === 'percentage' ? subtotal * (surcharge / 100) : surcharge;
    const total = subtotal + surchargeAmount;
    const profit = total - totalCost;
    const margin = total > 0 ? (profit / total) * 100 : 0;


    const getProductName = useCallback((productId?: string) => {
        if (!productId) return undefined;
        return products.find(p => p.id === productId)?.name;
    }, [products]);

    return (
    <>
    {showDetailsConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all">
                <div className="p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Detalhes Adicionais?</h2>
                    <p className="text-gray-600 mb-6">Deseja adicionar alguma observação ou detalhe extra para este quadro?</p>
                </div>
                <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg">
                    <button 
                        type="button" 
                        onClick={() => {
                            setShowDetailsConfirmation(false);
                            observationsRef.current?.focus();
                        }} 
                        className="py-2 px-4 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 transition"
                    >
                        Sim, Adicionar Detalhe
                    </button>
                    <button 
                        type="button" 
                        onClick={() => {
                            setShowDetailsConfirmation(false);
                            executeSaveFrame();
                        }} 
                        className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Não, Adicionar Assim Mesmo
                    </button>
                </div>
            </div>
        </div>
    )}

    <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{quote ? 'Editar Pedido' : 'Novo Orçamento'}</h1>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                     <label className="block text-sm font-medium text-gray-700">Cliente</label>
                     <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                         {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                </div>
                <div>
                    <button onClick={onCancel} className="mr-2 py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleDraftSave} className="mr-2 py-2 px-4 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700">
                         {quote ? 'Salvar Alterações' : 'Salvar como Rascunho'}
                    </button>
                    <button onClick={handleSubmit} className="py-2 px-4 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700">Avançar para Finalizar</button>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Frame Configuration */}
            <div className="lg:w-2/3">
                <div className="bg-gray-50 p-6 rounded-md border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Configurar Quadro</h2>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-700">Nome do Quadro (Opcional)</label>
                               <input type="text" name="name" value={currentFrame.name} onChange={handleFrameFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Largura (cm)</label>
                                    <input type="number" name="width" value={currentFrame.width || ''} onChange={handleFrameFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Altura (cm)</label>
                                    <input type="number" name="height" value={currentFrame.height || ''} onChange={handleFrameFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                                    <input type="number" name="quantity" value={currentFrame.quantity} onChange={handleFrameFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                </div>
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Imagem da Obra</label>
                            <div className="mt-1 flex items-center space-x-4 p-2 border border-dashed rounded-md h-full">
                                {currentFrame.imageUrl && <img src={currentFrame.imageUrl} alt="Preview" className="h-24 w-auto object-contain rounded bg-gray-100 p-1" />}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Product Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4 pt-4 border-t">
                        {renderProductSelector('frame1', 'moldura', 'Primeira Moldura')}
                        {renderProductSelector('frame2', 'moldura', 'Segunda Moldura (Opcional)')}
                        
                        {/* Glass input with margin */}
                        <div>
                            {renderProductSelector('glass', 'vidro', 'Vidro')}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Margem Vidro (cm)</label>
                                <input 
                                    type="number" 
                                    name="glassMargin" 
                                    value={currentFrame.glassMargin || ''} 
                                    onChange={handleFrameFieldChange} 
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        
                        {renderProductSelector('backing', 'fundo', 'Fundo')}
                        
                        {/* Paspatur field with width input */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                             {renderProductSelector('passepartout', 'passe-partout', 'Paspatur')}
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Largura do Paspatur (cm)</label>
                                <input type="number" name="passepartoutWidth" value={currentFrame.passepartoutWidth} onChange={handleFrameFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>

                        {renderProductSelector('chassis', 'chassis', 'Chassis de Tela')}
                        <div>
                            {renderProductSelector('printing', 'impressao', 'Impressão')}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Margem Impressão (cm)</label>
                                <input 
                                    type="number" 
                                    name="printingMargin" 
                                    value={currentFrame.printingMargin || ''} 
                                    onChange={handleFrameFieldChange} 
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        {renderProductSelector('substrato', 'substrato', 'Substrato')}
                        {renderProductSelector('servico', 'servico', 'Serviço')}
                    </div>
                     {/* Extra Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Produto Extra (Nome)</label>
                            <input type="text" name="name" value={currentFrame.extraProduct.name} onChange={handleExtraProductChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Produto Extra (Preço)</label>
                             <input type="number" name="price" value={currentFrame.extraProduct.price} onChange={handleExtraProductChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea ref={observationsRef} name="observations" value={currentFrame.observations} onChange={handleFrameFieldChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-lg italic text-indigo-700 font-semibold"></textarea>
                    </div>

                    <div className="mt-6">
                        {editingFrameId ? (
                            <div className="flex gap-4">
                                <button type="button" onClick={handleSaveFrameClick} className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Atualizar Quadro</button>
                                <button type="button" onClick={handleCancelEdit} className="w-full py-2 px-4 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600">Cancelar Edição</button>
                            </div>
                        ) : (
                            <button type="button" onClick={handleSaveFrameClick} className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Adicionar Quadro ao Pedido</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Summary and Quote Details */}
            <div className="lg:w-1/3">
                <div className="bg-gray-50 p-6 rounded-md border sticky top-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo do Quadro Atual</h2>
                    <div className="space-y-2 text-sm mb-4">
                         <div className="flex justify-between"><span>Tamanho Interno:</span> <span className="font-medium">{calculatedData.internalWidth} x {calculatedData.internalHeight} cm</span></div>
                         <div className="flex justify-between"><span>Tamanho Vidro/Fundo:</span> <span className="font-medium">{calculatedData.sheetRequiredWidth.toFixed(2)} x {calculatedData.sheetRequiredHeight.toFixed(2)} cm</span></div>
                         <div className="flex justify-between"><span>Tamanho Externo:</span> <span className="font-medium">{calculatedData.externalWidth.toFixed(2)} x {calculatedData.externalHeight.toFixed(2)} cm</span></div>
                    </div>
                    
                    {renderWasteSection(currentFrame.frame1Id, calculatedData.frame1Waste, 'Primeira Moldura', 'includeFrame1WasteCost')}
                    {renderWasteSection(currentFrame.frame2Id, calculatedData.frame2Waste, 'Segunda Moldura', 'includeFrame2WasteCost')}
                    
                    <h3 className="text-md font-semibold text-gray-700 mt-4 pt-4 border-t">Itens do Quadro</h3>
                    <ul className="divide-y divide-gray-200 mb-4">
                        {calculatedData.items.map((item, i) => (
                             <li key={i} className="flex justify-between py-1 text-sm">
                                <span>{item.type}: {item.name}</span>
                                <span className="font-medium">R$ {item.price.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                        <span>Total do Quadro:</span>
                        <span>R$ {(calculatedData.totalPrice * currentFrame.quantity).toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-6 bg-white p-6 rounded-md border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes do Pedido</h2>
                     <h3 className="text-md font-semibold text-gray-700 mt-4">Quadros no Pedido: {frames.length}</h3>
                     <ul className="text-base mt-2 space-y-2">
                        {frames.map(frame => {
                             const components = [
                                { label: 'Primeira Moldura', name: getProductName(frame.frame1Id) },
                                { label: 'Segunda Moldura', name: getProductName(frame.frame2Id) },
                                { label: 'Vidro', name: getProductName(frame.glassId) },
                                { label: 'Fundo', name: getProductName(frame.backingId) },
                                { label: 'Paspatur', name: getProductName(frame.passepartoutId) },
                                { label: 'Substrato', name: getProductName(frame.substratoId) },
                                { label: 'Serviço', name: getProductName(frame.servicoId) },
                                { label: 'Chassis', name: getProductName(frame.chassisId) },
                                { label: 'Impressão', name: getProductName(frame.printingId) },
                                { label: 'Extra', name: frame.extraProduct.name && frame.extraProduct.price > 0 ? frame.extraProduct.name : undefined },
                            ].filter(c => c.name);

                            return (
                            <li key={frame.id} className="p-2 rounded-md hover:bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        {frame.imageUrl && <img src={frame.imageUrl} alt="Artwork" className="h-12 w-12 rounded-sm object-cover mr-3" />}
                                        <span className="font-medium">{frame.quantity}x {frame.name || 'Quadro sem nome'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-medium mr-4">R$ {(frame.totalPrice * frame.quantity).toFixed(2)}</span>
                                        <button onClick={() => handleEditFrame(frame.id)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mr-2">Editar</button>
                                        <button onClick={() => handleRemoveFrame(frame.id)} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none">&times;</button>
                                    </div>
                                </div>
                                {components.length > 0 && (
                                    <div className="pl-4 mt-2 text-sm text-gray-600 space-y-1 border-l-2 border-gray-100 ml-1">
                                        {components.map(comp => (
                                            <p key={comp.label}>
                                                <span className="font-semibold">{comp.label}:</span> {comp.name}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                { (status === 'Aprovado' || status === 'Vendido') && (
                                     <div className="mt-2 flex items-center space-x-2">
                                        <label className="text-xs font-medium text-gray-600 shrink-0">Status Produção:</label>
                                        <select
                                            value={frame.productionStatus || ''}
                                            onChange={(e) => handleProductionStatusChange(frame.id, e.target.value as FrameConfiguration['productionStatus'])}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs rounded border-gray-300 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="Em produção">Em produção</option>
                                            <option value="Pronto">Pronto</option>
                                            <option value="Entregue">Entregue</option>
                                        </select>
                                        {frame.productionStatus === 'Entregue' && frame.deliveryDate && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                em: {new Date(frame.deliveryDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </li>
                            )
                        })}
                     </ul>
                    <div className="border-t pt-2 mt-4 space-y-2">
                        <div className="flex justify-between text-md">
                            <span>Subtotal dos Quadros:</span>
                            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <label htmlFor="surcharge" className="text-md">Acrécimo:</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    id="surcharge"
                                    name="surcharge"
                                    value={surcharge || ''}
                                    onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-l-md text-right focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0,00"
                                />
                                <select 
                                    value={surchargeType} 
                                    onChange={e => setSurchargeType(e.target.value as 'fixed' | 'percentage')}
                                    className="px-2 py-1 border-t border-b border-r border-gray-300 bg-gray-50 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="fixed">R$</option>
                                    <option value="percentage">%</option>
                                </select>
                            </div>
                        </div>
                    </div>
                     <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
                        <span>Total do Pedido:</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-4 rounded-r-lg">
                        <div className="flex justify-between text-md font-semibold text-green-800">
                            <span>Lucro Estimado:</span>
                            <span>R$ {profit.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between text-sm font-medium text-green-700 mt-1">
                            <span>Margem:</span>
                            <span>{margin.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {productModalState.isOpen && productModalState.productType && (
            <ProductSelectionModal
                isOpen={productModalState.isOpen}
                onClose={() => setProductModalState({ isOpen: false, productType: null, fieldToUpdate: null })}
                onSelectProduct={handleProductSelect}
                products={products}
                productType={productModalState.productType}
            />
        )}
    </>
    );
};

export default QuoteForm;