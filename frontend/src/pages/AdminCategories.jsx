import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Loader2, Edit2, X } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editValue, setEditValue] = useState('');
    const confirm = useConfirm();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get(import.meta.env.VITE_API_URL + '/api/categories');
            setCategories(res.data);
        } catch {
            notify.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(import.meta.env.VITE_API_URL + '/api/categories',
                { name: newCategory },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCategories(res.data.data);
            setNewCategory('');
            notify.success(res.data.message || "Category added successfully!");
        } catch (error) {
            notify.error(error.response?.data?.message || "Failed to add category");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setEditValue(category);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editValue.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${encodeURIComponent(editingCategory)}`,
                { name: editValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCategories(res.data.data);
            setEditingCategory(null);
            setEditValue('');
            notify.success(res.data.message || "Category updated successfully!");
        } catch (error) {
            notify.error(error.response?.data?.message || "Failed to update category");
        }
    };

    const handleDelete = async (categoryName) => {
        const confirmed = await confirm({
            title: 'Delete Category',
            description: `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone!`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            try {
                const token = localStorage.getItem('token');
                const loadingToastId = notify.loading('Deleting category...');
                const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${encodeURIComponent(categoryName)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(res.data.data);
                notify.update(loadingToastId, { render: res.data.message || 'Category deleted successfully!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Failed to delete category";
                notify.error(errorMessage);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <Tags className="text-rose-500" /> Category Management
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">Manage product category labels.</p>
                </div>
            </div>

            {editingCategory !== null ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <form onSubmit={handleUpdate} className="flex gap-4">
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Category name..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCategory(null);
                                setEditValue('');
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <form onSubmit={handleAdd} className="flex gap-4 mb-8">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g. Hip-Hop Cap"
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-rose-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categories.length === 0 ? (
                        <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                            <Tags size={48} className="text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-zinc-300">No categories found</h3>
                            <p className="text-zinc-500 mt-1">Add a new category to get started.</p>
                        </div>
                    ) : (
                        categories.map((cat, i) => (
                            <div
                                key={i}
                                className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg group hover:border-zinc-600 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-zinc-300 flex-1 truncate">{cat}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="text-zinc-600 hover:text-blue-500 transition-colors p-1"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat)}
                                            className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}