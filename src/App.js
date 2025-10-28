import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AdminInterface from './components/AdminInterface';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <AdminInterface />
      </div>
    </Provider>
  );
}

export default App;
