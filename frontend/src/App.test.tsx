import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MindEase application', () => {
  render(<App />);
  // Simple test to ensure the app renders without crashing
  expect(document.body).toBeInTheDocument();
});

test('app component exists', () => {
  expect(App).toBeDefined();
});