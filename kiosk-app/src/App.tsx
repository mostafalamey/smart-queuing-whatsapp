import React from 'react';
import ServiceSelection from './components/ServiceSelection';
import TicketDisplay from './components/TicketDisplay';
import PrintButton from './components/PrintButton';

const App: React.FC = () => {
  return (
    <div>
      <h1>Smart Queuing Kiosk</h1>
      <ServiceSelection />
      <TicketDisplay />
      <PrintButton />
    </div>
  );
};

export default App;