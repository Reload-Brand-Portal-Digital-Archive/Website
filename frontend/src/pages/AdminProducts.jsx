import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function AdminProducts() {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in duration-500">
            <ShoppingBag size={48} className="text-zinc-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Pengelolaan Produk</h2>
            <p className="text-zinc-400">Halaman ini sedang dalam tahap pengembangan.</p>
        </div>
    );
}
