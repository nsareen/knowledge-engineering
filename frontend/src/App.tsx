import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import GraphView from './pages/GraphView';
import Search from './pages/Search';
import Chat from './pages/Chat';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/graph" element={<GraphView />} />
        <Route path="/search" element={<Search />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Layout>
  );
}

export default App;