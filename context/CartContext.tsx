"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type CartItem = {
    id: string;
    date: string;
    professorName: string;
    professorEmail: string;
    description?: string;
    price: number;
    modality: "online" | "presencial";
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    updateItemModality: (itemId: string, modality: "online" | "presencial") => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    isOpen: boolean;
    toggleCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addToCart = (item: CartItem) => {
        setItems((prev) => {
            // Evitar duplicados
            if (prev.find((i) => i.id === item.id)) return prev;
            return [...prev, item];
        });
        setIsOpen(true);
    };

    const updateItemModality = (itemId: string, modality: "online" | "presencial") => {
        setItems((prev) => prev.map((item) =>
            item.id === itemId ? { ...item, modality } : item
        ));
    };

    const removeFromCart = (itemId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const clearCart = () => setItems([]);
    const toggleCart = () => setIsOpen((prev) => !prev);

    return (
        <CartContext.Provider value={{ items, addToCart, updateItemModality, removeFromCart, clearCart, isOpen, toggleCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
