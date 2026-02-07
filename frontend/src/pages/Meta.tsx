import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import MetaTable from '../components/tables/MetaTable';
import Loader from '../components/shared/Loader';
import { TestMetadata } from '../types';
import api from '../services/api';

const Meta: React.FC = () => {
  const [data, setData] = useState<TestMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/metadata');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (metadata: Omit<TestMetadata, 'id' | 'is_default'>) => {
    try {
      const response = await api.post('/metadata', metadata);
      setData((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding metadata:', error);
    }
  };

  const handleUpdate = async (
    id: number,
    updates: Partial<TestMetadata>,
    reason?: string
  ) => {
    try {
      const response = await api.put(`/metadata/${id}`, { ...updates, reason });
      setData((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await api.delete(`/metadata/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting metadata:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header title="Meta Data Table" />

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <a href="/reception" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Reception
            </a>
            <a href="/meta" className="px-6 py-3 font-medium bg-primary text-white border-b-2 border-primary">
              Meta
            </a>
            <a href="/progress" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Progress
            </a>
            <a href="/tracker" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Tracker
            </a>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <Loader />
        ) : (
          <div className="card">
            <MetaTable
              data={data}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>

      <footer className="bg-primary/80 backdrop-blur-sm border-t border-highlight/20 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Meta;