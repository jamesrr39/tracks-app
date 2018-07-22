import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
// import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

const elements = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

ReactDOM.render(elements, document.getElementById('root') as HTMLElement
);
registerServiceWorker();
