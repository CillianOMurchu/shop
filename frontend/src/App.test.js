import { render, screen } from '@testing-library/react';
import App from './App';

test('renders admin interface', () => {
  render(<App />);
  const headerElement = screen.getByText(/generic admin interface/i);
  expect(headerElement).toBeInTheDocument();
});
