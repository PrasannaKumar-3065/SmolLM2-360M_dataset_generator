import { Component } from 'react';
import logo from './logo.svg';
import ChatBot from './components/ChatBot'
import { Routes, Route } from "react-router-dom";

function App() {
  return (
      <Routes>
      <Route path="/" element={<ChatBot />} />
      </Routes>
  );
}

export default App;
