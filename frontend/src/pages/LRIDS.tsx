import React, { useState, useEffect } from 'react';
import LRIDSTable from '../components/tables/LRIDSTable';
import { useSocket as useSocketHook } from '../hooks/useSocket';
import { LRIDSData } from '../types';
import api from '../services/api';
import { joinLRIDS } from '../services/socket';

const LRIDS: React.FC = () => {
  const [data, setData] = useState<LRIDSData[]>([]);

  useEffect(() => {
    fetchData();
    joinLRIDS();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Real-time updates
  useSocketHook('test-updated', () => {
    fetchData();
  });

  useSocketHook('data-updated', () => {
    fetchData();
  });

  const fetchData = async () => {
    try {
      const response = await api.get('/lrids');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching LRIDS data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent p-8">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-center">
          <img
            src="/images/logo-nakasero.png"
            alt="Nakasero Hospital"
            className="h-16"
          />
        </div>

        <LRIDSTable data={data} />
      </div>
    </div>
  );
};

export default LRIDS;