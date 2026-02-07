import React from 'react';
import Header from '../components/shared/Header';
import Navbar from '../components/shared/Navbar';

interface PlaceholderProps {
  title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header title={title} />
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="card text-center py-20">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {title} - Coming Soon
          </h2>
          <p className="text-gray-400 text-lg">
            This feature is under development and will be available in the next update.
          </p>
        </div>
      </main>

      <footer className="bg-primary/80 backdrop-blur-sm border-t border-highlight/20 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Placeholder;