import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// 1. Define the possible product types and the context shape
export type ProductType = 'Conventional' | 'IFB' | null;

interface ProductSelectionContextType {
  selectedProduct: ProductType;
  setSelectedProduct: (product: ProductType) => void;
  // This function is for changing the state, but we will wrap it for consistency
  setProductAndNavigate: (product: ProductType) => void; 
}

// 2. Create the Context with a default undefined value
const ProductSelectionContext = createContext<ProductSelectionContextType | undefined>(undefined);

// 3. Custom Hook to use the context
export const useProductSelection = () => {
  const context = useContext(ProductSelectionContext);
  if (context === undefined) {
    throw new Error('useProductSelection must be used within a ProductSelectionProvider');
  }
  return context;
};

// 4. Provider Component
interface ProductSelectionProviderProps {
  children: ReactNode;
}

export const ProductSelectionProvider: React.FC<ProductSelectionProviderProps> = ({ children }) => {
  const [selectedProduct, setSelectedProductState] = useState<ProductType>(null);

  // This function handles saving the state and could potentially handle navigation later
  const setProductAndNavigate = useCallback((product: ProductType) => {
    setSelectedProductState(product);
    // You can add logic here to save to localStorage if needed
    // localStorage.setItem('productType', product); 
  }, []);

  const contextValue = useMemo(() => ({
    selectedProduct,
    setSelectedProduct: setSelectedProductState, // expose raw setter if needed
    setProductAndNavigate,
  }), [selectedProduct, setProductAndNavigate]);

  return (
    <ProductSelectionContext.Provider value={contextValue}>
      {children}
    </ProductSelectionContext.Provider>
  );
};